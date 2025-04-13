package cmd

import (
	"ags/lib"
	"bytes"
	"encoding/base64"
	"os"
	"path/filepath"
	"regexp"
	"text/template"

	"github.com/spf13/cobra"
)

var bashWrapper = `#!{{.Bash}}
file="${XDG_RUNTIME_DIR:-/tmp}/{{.Hash}}-ags.js"

cat <<EOF | base64 --decode > $file
{{.JsCode}}
EOF

LD_PRELOAD="{{.Gtk4LayerShell}}" {{.Gjs}} -m $file $@`

type WrapperArgs struct {
	Bash           string
	Hash           string
	JsCode         string
	Gtk4LayerShell string
	Gjs            string
}

var bundleCommand = &cobra.Command{
	Use:     "bundle [entryfile] [outfile]",
	Short:   "Bundle an app",
	Example: `  bundle app.ts my-shell -d "DATADIR='/usr/share/my-shell'"`,
	Args:    cobra.ExactArgs(2),
	Run:     bundle,
}

func init() {
	f := bundleCommand.Flags()
	f.StringVarP(&workingDir, "root", "r", "", "root directory of the project")
	f.StringArrayVarP(&defines, "define", "d", []string{}, "replace global identifiers with constant expressions")
	f.StringArrayVar(&alias, "alias", []string{}, "alias packages")
	f.UintVarP(&gtkVersion, "gtk", "g", 0, "gtk version")
}

func inferGtkVersion(entryfile string) uint {
	content, err := os.ReadFile(entryfile)
	if err != nil {
		lib.Err(err)
	}

	gtk3 := `(?:from|import)\s+["'](?:gi://Gtk\?version=3\.0|ags/gtk3/app)["']`
	if regexp.MustCompile(gtk3).Match(content) {
		return 3
	}

	gtk4 := `(?:from|import)\s+["'](?:gi://Gtk\?version=4\.0|ags/gtk4/app)["']`
	if regexp.MustCompile(gtk4).Match(content) {
		return 4
	}

	lib.Err("Failed to infer Gtk version from entry file.\n" +
		lib.Cyan("tip: ") + "specify it with the --gtk flag")
	return 0
}

func bundle(cmd *cobra.Command, args []string) {
	path, err := filepath.Abs(args[0])
	if err != nil {
		lib.Err(err)
	}

	outfile, err := filepath.Abs(args[1])
	if err != nil {
		lib.Err(err)
	}

	info, err := os.Stat(path)
	if err != nil {
		lib.Err(err)
	}

	infile := path
	if info.IsDir() {
		infile = getAppEntry(path)
	}

	if gtkVersion == 0 {
		gtkVersion = inferGtkVersion(infile)
	}

	result := lib.Bundle(lib.BundleOpts{
		Outfile:          "",
		Infile:           infile,
		Alias:            alias,
		Defines:          defines,
		GtkVersion:       gtkVersion,
		WorkingDirectory: workingDir,
	})

	if len(result.OutputFiles) != 1 {
		lib.Err("internal error")
	}

	jscode := result.OutputFiles[0].Contents

	wrapperArgs := WrapperArgs{
		Hash:           base64.RawURLEncoding.EncodeToString(jscode)[:6],
		JsCode:         base64.StdEncoding.EncodeToString(jscode),
		Gtk4LayerShell: gtk4LayerShell,
		Bash:           bash,
		Gjs:            gjs,
	}

	if gtkVersion == 3 {
		wrapperArgs.Gtk4LayerShell = ""
	}

	tmpl, err := template.New("bashWrapper").Parse(bashWrapper)
	if err != nil {
		lib.Err(err)
	}

	var scriptBuffer bytes.Buffer
	if err := tmpl.Execute(&scriptBuffer, wrapperArgs); err != nil {
		lib.Err(err)
	}

	err = os.WriteFile(outfile, scriptBuffer.Bytes(), 0755)
	if err != nil {
		lib.Err(err)
	}
}
