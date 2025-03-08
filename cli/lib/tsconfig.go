package lib

import (
	"encoding/json"
	"strings"

	"github.com/titanous/json5"
)

func defaultTsconfig(gtkVersion uint) map[string]interface{} {
	gtk := "gtk3"
	if gtkVersion == 4 {
		gtk = "gtk4"
	}

	return map[string]interface{}{
		"compilerOptions": map[string]interface{}{
			"experimentalDecorators": true,
			"module":                 "ES2022",
			"target":                 "ES2022",
			"strict":                 true,
			"moduleResolution":       "Bundler",
			"jsx":                    "react-jsx",
			"jsxImportSource":        "ags/" + gtk,
		},
	}
}

func updateTsconfig(tsconfig map[string]interface{}) {
	opts, ok := tsconfig["compilerOptions"].(map[string]interface{})
	if !ok {
		opts = map[string]interface{}{}
	}

	src, ok := opts["jsxImportSource"].(string)
	if !ok {
		src = "gtk3"
	}

	var gtk string
	if strings.HasSuffix(src, "gtk4") {
		gtk = "gtk4"
	} else {
		gtk = "gtk3"
	}

	opts["experimentalDecorators"] = true
	opts["module"] = "ES2022"
	opts["target"] = "ES2022"
	opts["moduleResolution"] = "Bundler"
	opts["jsx"] = "react-jsx"
	opts["jsxImportSource"] = "ags/" + gtk
}

// if tsconfig.json exists in srcdir returns an updated config
// otherwise returns a default config
func GetTsconfig(srcdir string, gtkVersion uint) string {
	// TODO: look in parent directories recursively
	path := srcdir + "/tsconfig.json"

	var tsconfig map[string]interface{}
	if FileExists(path) {
		if err := json5.Unmarshal(ReadFile(path), &tsconfig); err != nil {
			Err(err)
		}

		updateTsconfig(tsconfig)
	} else {
		tsconfig = defaultTsconfig(gtkVersion)
	}

	conf, err := json.MarshalIndent(tsconfig, "", "    ")
	if err != nil {
		Err(err)
	}

	return string(conf)
}
