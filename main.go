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
	astalGjs       = "/usr/share/astal/gjs"
	tsForGir       = "@ts-for-gir/cli@4.0.0-beta.15"
)

func main() {
	lib.Initialize(astalGjs)
	cmd.Initialize(cmd.Variables{
		Version:        version,
		Data:           data,
		Gtk4LayerShell: gtk4LayerShell,
		AstalGjs:       astalGjs,
		TsForGir:       tsForGir,
	})
	cmd.Execute()
}
