package main

import (
	_ "embed"
	"fmt"
	"os"
	"strings"
)

var (
	astalGjs = "/usr/share/astal/gjs"

	//go:embed data/env.d.ts
	envdts string

	//go:embed data/tsconfig.json
	tsconfig string

	//go:embed data/config/Bar.jsx
	jsx string

	//go:embed data/config/Bar.tsx
	tsx string

	//go:embed data/config/app.ts
	app string

	//go:embed data/config/style.css
	style string
)

type File struct {
	name    string
	content string
}

func ifelse(condition bool, yes string, no string) string {
	if condition {
		return yes
	} else {
		return no
	}
}

func getConfig(typescript bool) (File, File) {
	lang := ifelse(typescript, "ts", "js")

	appfile := File{
		name:    "app." + lang,
		content: app,
	}

	barfile := File{
		name:    "Bar." + lang + "x",
		content: ifelse(typescript, tsx, jsx),
	}

	return appfile, barfile
}

// TODO: interactive init
func InitConfig() {
	config := *Opts.config
	if info, err := os.Stat(config); err == nil && info.IsDir() {
		Err("could not initialize: " + Cyan(config) + " is not empty")
	}

	tsconf := strings.ReplaceAll(tsconfig, "@ASTAL_GJS@", astalGjs)
	appfile, bar := getConfig(true)

	Mkdir(config + "/widget")

	WriteFile(config+"/.gitignore", "@girs/\nnode_modules/")
	WriteFile(config+"/tsconfig.json", tsconf)
	WriteFile(config+"/env.d.ts", envdts)
	WriteFile(config+"/style.css", style)
	WriteFile(config+"/widget/"+bar.name, bar.content)
	WriteFile(config+"/"+appfile.name, appfile.content)

	if err := GenTypes(); err != nil {
		Err(err)
	}

	fmt.Println(Green("project ready") + " at " + Cyan(config))
}
