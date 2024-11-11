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

type tsCompilerOptions struct {
	ExperimentalDecorators bool                `json:"experimentalDecorators"`
	Target                 string              `json:"target"`
	Module                 string              `json:"module"`
	ModuleResolution       string              `json:"moduleResolution"`
	Jsx                    string              `json:"jsx"`
	JsxImportSource        string              `json:"jsxImportSource"`
	Paths                  map[string][]string `json:"paths"`
}

type tsconfig struct {
	CompilerOptions tsCompilerOptions `json:"compilerOptions"`
}

func defaultTsconfig() tsconfig {
	return tsconfig{
		CompilerOptions: tsCompilerOptions{
			ExperimentalDecorators: true,
			Module:                 "ES2022",
			Target:                 "ES2022",
			ModuleResolution:       "Bundler",
			Jsx:                    "react-jsx",
			JsxImportSource:        astalGjs + "/" + defaultGtkVersion,
			Paths: map[string][]string{
				"astal":   {astalGjs},
				"astal/*": {astalGjs + "/*"},
			},
		},
	}
}

func (tsconfig *tsconfig) updateTsconfig() {
	src := tsconfig.CompilerOptions.JsxImportSource

	var gtk string
	if strings.HasSuffix(src, "gtk4") {
		gtk = "/gtk4"
	} else {
		gtk = "/gtk3"
	}

	tsconfig.CompilerOptions.ExperimentalDecorators = true
	tsconfig.CompilerOptions.Module = "ES2022"
	tsconfig.CompilerOptions.Target = "ES2022"
	tsconfig.CompilerOptions.ModuleResolution = "Bundler"
	tsconfig.CompilerOptions.Jsx = "react-jsx"
	tsconfig.CompilerOptions.JsxImportSource = astalGjs + gtk
	tsconfig.CompilerOptions.Paths["astal"] = []string{astalGjs}
	tsconfig.CompilerOptions.Paths["astal/*"] = []string{astalGjs + "/*"}
}

// if tsconfig.json exists in srcdir returns an updated config
// otherwise returns a default config
func GetTsconfig(srcdir string) string {
	path := srcdir + "/tsconfig.json"

	var tsconfig tsconfig
	if FileExists(path) {
		data, err := os.ReadFile(path)
		if err != nil {
			Err(err)
		}

		err = json5.Unmarshal(data, &tsconfig)
		if err != nil {
			Err(err)
		}

		tsconfig.updateTsconfig()
	} else {
		tsconfig = defaultTsconfig()
	}

	conf, err := json.MarshalIndent(tsconfig, "", "    ")
	if err != nil {
		Err(err)
	}

	return string(conf)
}
