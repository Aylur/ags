package cmd

import (
	"ags/lib"
	"bytes"
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/spf13/cobra"
)

var bashWrapper = `#!{{.Bash}}
cat <<EOF | base64 --decode > {{.JsOutput}}
{{.JsCode}}
EOF

LD_PRELOAD={{.Gtk4LayerShell}} {{.Gjs}} -m {{.JsOutput}}`

type WrapperArgs struct {
	Bash           string
	JsOutput       string
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

	gtk3 := strings.Contains(string(content), `from "gi://Gtk?version=3.0"`) ||
		strings.Contains(string(content), `import "gi://Gtk?version=3.0"`) ||
		strings.Contains(string(content), `from "ags/gtk3/app"`)

	if gtk3 {
		return 3
	}

	gtk4 := strings.Contains(string(content), `from "gi://Gtk?version=4.0"`) ||
		strings.Contains(string(content), `import "gi://Gtk?version=4.0"`) ||
		strings.Contains(string(content), `from "ags/gtk4/app"`)

	if gtk4 {
		return 4
	}

	lib.Err("Could not infer Gtk version from entry file.\n" +
		lib.Magenta("tip: ") + "specify it with the --gtk flag")
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

	rundir, found := os.LookupEnv("XDG_RUNTIME_DIR")
	if !found {
		rundir = "/tmp"
	}

	tmpfile := filepath.Join(rundir, "ags.js")

	lib.Bundle(lib.BundleOpts{
		Outfile:          tmpfile,
		Infile:           infile,
		Alias:            alias,
		Defines:          defines,
		GtkVersion:       gtkVersion,
		WorkingDirectory: workingDir,
	})

	jscode, err := os.ReadFile(tmpfile)
	if err != nil {
		lib.Err(err)
	}

	wrapperArgs := WrapperArgs{
		JsOutput:       tmpfile,
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
