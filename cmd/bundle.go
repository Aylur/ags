package cmd

import (
	"ags/lib"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var (
	tsconfig   string
	workingDir string
)

var bundleCommand = &cobra.Command{
	Use:   "bundle [entryfile] [outfile]",
	Short: "Bundle an app",
	Args:  cobra.ExactArgs(2),
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

		if info.IsDir() {
			lib.Bundle(getAppEntry(path), outfile, tsconfig, workingDir)
		} else {
			lib.Bundle(path, outfile, tsconfig, workingDir)
		}
	},
}

func init() {
	f := bundleCommand.Flags()
	f.StringVar(&tsconfig, "tsconfig", "", "path to tsconfig.json")
	f.StringVar(&workingDir, "src", "", "source directory of the bundle")
}
