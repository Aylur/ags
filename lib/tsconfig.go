package lib

import (
	"encoding/json"
	"os"
	"strings"

	"github.com/titanous/json5"
)

var (
	astalGjs          string
	defaultGtkVersion = "gtk3"
)

func Initialize(_astalGjs string) {
	astalGjs = _astalGjs
}

func defaultTsconfig() map[string]interface{} {
	return map[string]interface{}{
		"compilerOptions": map[string]interface{}{
			"experimentalDecorators": true,
			"module":                 "ES2022",
			"target":                 "ES2022",
			"moduleResolution":       "Bundler",
			"jsx":                    "react-jsx",
			"jsxImportSource":        astalGjs + "/" + defaultGtkVersion,
			"paths": map[string][]string{
				"astal":   {astalGjs},
				"astal/*": {astalGjs + "/*"},
			},
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
		src = "/gtk3"
	}

	var gtk string
	if strings.HasSuffix(src, "gtk4") {
		gtk = "/gtk4"
	} else {
		gtk = "/gtk3"
	}

	opts["experimentalDecorators"] = true
	opts["module"] = "ES2022"
	opts["target"] = "ES2022"
	opts["moduleResolution"] = "Bundler"
	opts["jsx"] = "react-jsx"
	opts["jsxImportSource"] = astalGjs + gtk

	paths, ok := opts["paths"].(map[string]interface{})
	if !ok {
		paths = map[string]interface{}{
			"astal":   []string{astalGjs},
			"astal/*": []string{astalGjs + "/*"},
		}
	}

	paths["astal"] = []string{astalGjs}
	paths["astal/*"] = []string{astalGjs + "/*"}
}

// if tsconfig.json exists in srcdir returns an updated config
// otherwise returns a default config
func GetTsconfig(srcdir string) string {
	path := srcdir + "/tsconfig.json"

	var tsconfig map[string]interface{}
	if FileExists(path) {
		data, err := os.ReadFile(path)
		if err != nil {
			Err(err)
		}

		err = json5.Unmarshal(data, &tsconfig)
		if err != nil {
			Err(err)
		}

		updateTsconfig(tsconfig)
	} else {
		tsconfig = defaultTsconfig()
	}

	conf, err := json.MarshalIndent(tsconfig, "", "    ")
	if err != nil {
		Err(err)
	}

	return string(conf)
}
