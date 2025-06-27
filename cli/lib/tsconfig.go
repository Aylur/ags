package lib

import (
	"encoding/json"

	"github.com/titanous/json5"
)

func defaultTsconfig(gtkVersion uint) map[string]any {
	gtk := "gtk4"
	if gtkVersion == 3 {
		gtk = "gtk3"
	}

	return map[string]any{
		"compilerOptions": map[string]any{
			"module":           "ES2022",
			"target":           "ES2020",
			"strict":           true,
			"moduleResolution": "Bundler",
			"jsx":              "react-jsx",
			"jsxImportSource":  "ags/" + gtk,
		},
	}
}

// if jsxImportSource is not present update it to `gtkVersion`
func updateTsconfig(tsconfig map[string]any, gtkVersion uint) {
	compilerOptions, ok := tsconfig["compilerOptions"].(map[string]any)
	if !ok {
		compilerOptions = map[string]any{}
	}

	jsxImportSource, ok := compilerOptions["jsxImportSource"].(string)
	if !ok {
		jsxImportSource = "ags/gtk4"
		if gtkVersion == 3 {
			jsxImportSource = "ags/gtk3"
		}
	}

	compilerOptions["module"] = "ES2022"
	compilerOptions["target"] = "ES2020"
	compilerOptions["moduleResolution"] = "Bundler"
	compilerOptions["jsx"] = "react-jsx"
	compilerOptions["jsxImportSource"] = jsxImportSource
}

// if tsconfig.json exists in srcdir returns an updated config
// otherwise returns a default config
func GetTsconfig(srcdir string, gtkVersion uint) string {
	// TODO: look in parent directories recursively
	path := srcdir + "/tsconfig.json"

	var tsconfig map[string]any
	if FileExists(path) {
		if err := json5.Unmarshal(ReadFile(path), &tsconfig); err != nil {
			Err(err)
		}

		updateTsconfig(tsconfig, gtkVersion)
	} else {
		tsconfig = defaultTsconfig(gtkVersion)
	}

	conf, err := json.MarshalIndent(tsconfig, "", "  ")
	if err != nil {
		Err(err)
	}

	return string(conf)
}
