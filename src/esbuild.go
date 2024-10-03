package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
)

var astalGjs = "/usr/share/astal/gjs"

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
				// if cwd is the path of the currently loaded file sass warns about it
				// in order to avoid the deprecation warning we explicitly set it to something else
				sass.Dir = "/"
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

func fixTsCfg(infile string) string {
	tsCfgPath := filepath.Join(filepath.Dir(infile), "tsconfig.json")
	tsCfgData, err := os.ReadFile(tsCfgPath)
	if err != nil {
		Err(err)
	}

	var tsCfg map[string]interface{}
	json.Unmarshal(tsCfgData, &tsCfg)

	compilerOptions, ok := tsCfg["compilerOptions"].(map[string]interface{})
	if !ok {
    // If compilerOptions doesn't exist or isn't a map, create it
		compilerOptions = make(map[string]interface{})
		tsCfg["compilerOptions"] = compilerOptions
	}

	// Insert paths
	paths := map[string]interface{}{
		"astal":   []string{astalGjs},
		"astal/*": []string{astalGjs + "/src/*"},
	}
	compilerOptions["paths"] = paths

	// Insert jsxImportSource
	compilerOptions["jsxImportSource"] = astalGjs + "/src/jsx"

	updatedTsCfg, err := json.Marshal(tsCfg)
	if err != nil {
		Err(err)
	}

	return string(updatedTsCfg)
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
		TsconfigRaw: fixTsCfg(infile),
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
