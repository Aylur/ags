package main

import (
	"flag"
	"os"
	"path"
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
		// TODO: https://github.com/glromeo/esbuild-sass-plugin
	},
}

func main() {
	entry := flag.String("entry", "", "EntryPoint")
	outfile := flag.String("outfile", "", "Outfile")
	help := flag.Bool("help", false, "Print this help")

	flag.Parse()

	if *help || *entry == "" || *outfile == "" {
		flag.Usage()
		os.Exit(0)
	}

	result := api.Build(api.BuildOptions{
		Color:       api.ColorAlways,
		LogLevel:    api.LogLevelWarning,
		EntryPoints: []string{*entry},
		Bundle:      true,
		Outfile:     *outfile,
		Format:      api.FormatESModule,
		Platform:    api.PlatformNeutral,
		Write:       true,
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

	if len(result.Errors) > 0 {
		os.Exit(1)
	}
}
