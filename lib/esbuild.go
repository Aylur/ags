package lib

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

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

// TODO: bundle plugins
// svg loader
// other css preproceccors
// http plugin with caching
func Bundle(infile, outfile, tsconfig, cwd string) {
	srcdir := filepath.Dir(infile)

	if cwd == "" {
		cwd = srcdir
	} else {
		var err error
		cwd, err = filepath.Abs(cwd)
		if err != nil {
			Err(err)
		}
	}

	if tsconfig != "" {
		// if a tsconfig file is specified use that
		path, err := filepath.Abs(tsconfig)
		if err != nil {
			Err(err)
		}

		data, err := os.ReadFile(path)
		if err != nil {
			Err(err)
		}

		tsconfig = string(data)
	} else if FileExists("tsconfig.json") {
		// check cwd for tsconfig
		cwd, err := os.Getwd()
		if err != nil {
			Err(err)
		}

		tsconfig = GetTsconfig(cwd)
	} else {
		// fallback to default
		tsconfig = GetTsconfig(srcdir)
	}

	result := api.Build(api.BuildOptions{
		Color:         api.ColorAlways,
		LogLevel:      api.LogLevelWarning,
		EntryPoints:   []string{infile},
		Bundle:        true,
		Outfile:       outfile,
		Format:        api.FormatESModule,
		Platform:      api.PlatformNeutral,
		AbsWorkingDir: cwd,
		TsconfigRaw:   tsconfig,
		Write:         true,
		Define: map[string]string{
			"SRC": fmt.Sprintf(`"%s"`, srcdir),
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
	})

	// TODO: custom error logs
	if len(result.Errors) > 0 {
		os.Exit(1)
	}
}
