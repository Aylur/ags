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
	cat            = "/bin/cat"
	base64         = "/bin/base64"
)

func main() {
	lib.Initialize(agsJsPackage)
	cmd.Initialize(cmd.Env{
		Version:        version,
		Data:           data,
		Gtk4LayerShell: gtk4LayerShell,
		AgsJsPackage:   agsJsPackage,
		TSForGir:       tsForGir,
		Gjs:            gjs,
		Bash:           bash,
		Cat:            cat,
		Base64:         base64,
	})
	cmd.Execute()
}
