package lib

import (
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

var agsJsPackage string

func Initialize(jsPackage string) {
	agsJsPackage = jsPackage
}

var inlinePlugin api.Plugin = api.Plugin{
	Name: "inline",
	Setup: func(build api.PluginBuild) {
		build.OnResolve(api.OnResolveOptions{Filter: "^inline:"},
			func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				resolved := path.Join(
					args.ResolveDir,
					strings.Replace(args.Path, "inline:", "", 1),
				)

				return api.OnResolveResult{
					Path:      resolved,
					Namespace: "inline",
				}, nil
			},
		)

		build.OnLoad(api.OnLoadOptions{Filter: ".*", Namespace: "inline"},
			func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				data, err := os.ReadFile(args.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}

				content := string(data)

				return api.OnLoadResult{
					Contents:   &content,
					WatchFiles: []string{args.Path},
					Loader:     api.LoaderText,
				}, nil
			})
	},
}

var sassPlugin api.Plugin = api.Plugin{
	Name: "sass",
	Setup: func(build api.PluginBuild) {
		build.OnResolve(api.OnResolveOptions{Filter: `.*\.scss$`},
			func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{
					Path: path.Join(
						args.ResolveDir,
						args.Path,
					),
					Namespace: "sass",
				}, nil
			},
		)

		build.OnLoad(api.OnLoadOptions{Filter: `.*\.scss$`, Namespace: "sass"},
			func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				sass := Exec("sass", args.Path, "-I", filepath.Dir(args.Path))
				// if cwd is the path of the currently loaded file sass warns about it
				// in order to avoid the deprecation warning we explicitly set it to something else
				sass.Dir = "/"
				sass.Stderr = os.Stderr

				data, err := sass.Output()
				if err != nil {
					return api.OnLoadResult{}, err
				}

				content := strings.TrimSpace(string(data))
				return api.OnLoadResult{
					Contents:   &content,
					WatchFiles: []string{args.Path},
					Loader:     api.LoaderText,
				}, nil
			})
	},
}

var blpPlugin api.Plugin = api.Plugin{
	Name: "blueprint",
	Setup: func(build api.PluginBuild) {
		build.OnResolve(api.OnResolveOptions{Filter: `.*\.blp$`},
			func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{
					Path: path.Join(
						args.ResolveDir,
						args.Path,
					),
					Namespace: "blueprint",
				}, nil
			},
		)

		build.OnLoad(api.OnLoadOptions{Filter: `.*\.blp$`, Namespace: "blueprint"},
			func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				blp := Exec("blueprint-compiler", "compile", args.Path)
				blp.Stderr = os.Stderr

				data, err := blp.Output()
				if err != nil {
					return api.OnLoadResult{}, err
				}

				content := strings.TrimSpace(string(data))
				return api.OnLoadResult{
					Contents:   &content,
					WatchFiles: []string{args.Path},
					Loader:     api.LoaderText,
				}, nil
			})
	},
}

func sliceToKV(keyValuePairs []string) map[string]string {
	pairs := make(map[string]string)
	for _, pair := range keyValuePairs {
		parts := strings.SplitN(pair, "=", 2)
		if len(parts) == 2 {
			pairs[parts[0]] = parts[1]
		} else {
			Err("Invalid key-value pair: " + pair)
		}
	}
	return pairs
}

type BundleOpts struct {
	Infile           string
	Outfile          string
	Defines          []string
	Alias            []string
	GtkVersion       uint
	WorkingDirectory string
}

// TODO: bundle plugins
// svg loader
// other css preproceccors
// http plugin with caching
func Bundle(opts BundleOpts) api.BuildResult {
	defines := sliceToKV(opts.Defines)
	alias := sliceToKV(opts.Alias)

	if _, ok := defines["SRC"]; !ok {
		defines["SRC"] = `"` + filepath.Dir(opts.Infile) + `"`
	}

	if _, ok := alias["ags"]; !ok {
		alias["ags"] = agsJsPackage + "/src"
	}

	buildOpts := api.BuildOptions{
		Color:       api.ColorAlways,
		LogLevel:    api.LogLevelWarning,
		EntryPoints: []string{opts.Infile},
		Bundle:      true,
		Outfile:     opts.Outfile,
		Format:      api.FormatESModule,
		Platform:    api.PlatformNeutral,
		Define:      defines,
		Alias:       alias,
		Target:      api.ES2022,
		Sourcemap:   api.SourceMapInline,
		Engines: []api.Engine{
			{Name: api.EngineFirefox, Version: "115"},
		},
		Loader: map[string]api.Loader{
			".js":  api.LoaderJSX,
			".css": api.LoaderText,
		},
		External: []string{
			"console",
			"system",
			"cairo",
			"gettext",
			"file://*",
			"gi://*",
			"resource://*",
		},
		Plugins: []api.Plugin{
			inlinePlugin,
			sassPlugin,
			blpPlugin,
		},
	}

	if opts.Outfile != "" {
		buildOpts.Write = true
	}

	if opts.WorkingDirectory != "" {
		dir, err := filepath.Abs(opts.WorkingDirectory)
		if err != nil {
			Err(err)
		}

		buildOpts.AbsWorkingDir = dir
		buildOpts.TsconfigRaw = GetTsconfig(dir, opts.GtkVersion)
	} else {
		buildOpts.TsconfigRaw = GetTsconfig(Cwd(), opts.GtkVersion)
	}

	result := api.Build(buildOpts)

	// TODO: custom error logs
	if len(result.Errors) > 0 {
		os.Exit(1)
	}

	return result
}
