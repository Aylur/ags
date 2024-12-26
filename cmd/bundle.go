package cmd

import (
	"ags/lib"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var (
	defines    []string
	usePackage bool
	gtkVersion int
)

var bundleCommand = &cobra.Command{
	Use:     "bundle [entryfile] [outfile]",
	Short:   "Bundle an app",
	Example: `  bundle app.ts my-shell -d "DATADIR='/usr/share/my-shell'"`,
	Args:    cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
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

		opts := lib.BundleOpts{
			Outfile:    outfile,
			UsePackage: usePackage,
			Defines:    defines,
			GtkVersion: gtkVersion,
		}

		if info.IsDir() {
			opts.Infile = getAppEntry(path)
		} else {
			opts.Infile = path
		}

		lib.Bundle(opts)
	},
}

func init() {
	f := bundleCommand.Flags()
	f.StringArrayVarP(&defines, "define", "d", []string{}, "replace global identifiers with constant expressions")
	f.BoolVarP(&usePackage, "package", "p", false, "use astal package as defined in package.json")
	f.IntVar(&gtkVersion, "gtk", 3, "gtk version")
	f.MarkHidden("gtk")

	f.String("src", "", "source directory of the bundle")
	f.MarkHidden("src")
	f.MarkDeprecated("src", `use cd /path/to/src && bundle --define="SRC='/path/to/src'"`)
}
