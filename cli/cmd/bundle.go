package cmd

import (
	"ags/lib"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
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
			Outfile:          outfile,
			Alias:            alias,
			Defines:          defines,
			GtkVersion:       gtkVersion,
			WorkingDirectory: workingDir,
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
	f.StringVarP(&workingDir, "root", "r", "", "root directory of the project")
	f.StringArrayVarP(&defines, "define", "d", []string{}, "replace global identifiers with constant expressions")
	f.StringArrayVar(&alias, "alias", []string{}, "alias packages")
	f.UintVar(&gtkVersion, "gtk", 3, "gtk version")
	f.MarkHidden("gtk")
	f.MarkHidden("alias")
}
