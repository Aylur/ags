package main

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
		build.OnResolve(api.OnResolveOptions{Filter: `.*\.(scss|sass)$`},
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

		build.OnLoad(api.OnLoadOptions{Filter: `.*\.(scss|sass)$`, Namespace: "sass"},
			func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				data, err := os.ReadFile(args.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}

				sass := Exec("sass", "--stdin", "-I", filepath.Dir(args.Path))
				sass.Stderr = os.Stderr
				stdin, _ := sass.StdinPipe()
				stdin.Write(data)
				stdin.Close()

				data, err = sass.Output()
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

// TODO:
// svg loader
// other css preproceccors
// http plugin with caching
func Build(infile, outfile string) {
	result := api.Build(api.BuildOptions{
		Color:       api.ColorAlways,
		LogLevel:    api.LogLevelWarning,
		EntryPoints: []string{infile},
		Bundle:      true,
		Outfile:     outfile,
		Format:      api.FormatESModule,
		Platform:    api.PlatformNeutral,
		Write:       true,
		Define: map[string]string{
			"SRC": fmt.Sprintf(`"%s"`, *Opts.config),
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
		},
	})

	// TODO: custom error logs
	if len(result.Errors) > 0 {
		os.Exit(1)
	}
}
