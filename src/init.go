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

	//go:embed data/config/Bar.tsx
	bartsx string

	//go:embed data/config/app.ts
	appts string

	//go:embed data/config/style.css
	stylecss string
)

func InitConfig() {
	config := *Opts.config
	if info, err := os.Stat(config); err == nil && info.IsDir() {
		Err("could not initialize: " + Cyan(config) + " is not empty")
	}

	tsconf := strings.ReplaceAll(tsconfig, "@ASTAL_GJS@", astalGjs)
	tsconf = strings.ReplaceAll(tsconf, "@GTK_VERSION@", "gtk3") // TODO: gtk4 flag
	Mkdir(config + "/widget")

	WriteFile(config+"/.gitignore", "@girs/\nnode_modules/")
	WriteFile(config+"/tsconfig.json", tsconf)
	WriteFile(config+"/env.d.ts", envdts)
	WriteFile(config+"/style.css", stylecss)
	WriteFile(config+"/widget/Bar.tsx", bartsx)
	WriteFile(config+"/app.ts", appts)

	if err := GenTypes(); err != nil {
		Err(err)
	}

	fmt.Println(Green("project ready") + " at " + Cyan(config))
}
