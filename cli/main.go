package main

import (
	"ags/cmd"
	"ags/lib"
	"embed"
)

var (
	//go:embed version
	version string

	//go:embed data
	data embed.FS

	// should be overriden with -ldflags
	tsForGir       = "@ts-for-gir/cli"
	gtk4LayerShell = "/usr/lib/libgtk4-layer-shell.so"
	agsJsPackage   = "/usr/share/ags/js"
	bash           = "/bin/sh"
	gjs            = "/bin/gjs"
)

func main() {
	lib.Initialize(agsJsPackage)
	cmd.Initialize(cmd.Variables{
		Version:        version,
		Data:           data,
		Gtk4LayerShell: gtk4LayerShell,
		AgsJsPackage:   agsJsPackage,
		TsForGir:       tsForGir,
		Gjs:            gjs,
		Bash:           bash,
	})
	cmd.Execute()
}
