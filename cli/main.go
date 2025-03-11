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
	gtk4LayerShell = "/usr/lib/libgtk4-layer-shell.so"
	agsJsPackage   = "/usr/share/ags/js"
	tsForGir       = "@ts-for-gir/cli"
)

func main() {
	lib.Initialize(agsJsPackage)
	cmd.Initialize(cmd.Variables{
		Version:        version,
		Data:           data,
		Gtk4LayerShell: gtk4LayerShell,
		AgsJsPackage:   agsJsPackage,
		TsForGir:       tsForGir,
	})
	cmd.Execute()
}
