package cmd

import (
	"ags/lib"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var gtk4 bool

var runCommand = &cobra.Command{
	Use:   "run [optional file or directory]",
	Short: "Run an app",
	Long:  `Run a given app. Defaults to ` + defaultConfigDir(),
	Args:  cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) > 0 {
			path, err := filepath.Abs(args[0])
			if err != nil {
				lib.Err(err)
			}

			info, err := os.Stat(path)
			if err != nil {
				lib.Err(err)
			}

			if info.IsDir() {
				run(getAppEntry(path), path)
			} else {
				run(path, filepath.Dir(path))
			}

		} else {
			dir := defaultConfigDir()
			run(getAppEntry(dir), dir)
		}
	},
}

func init() {
	runCommand.Flags().BoolVar(&gtk4, "gtk4", false, "preload Gtk4LayerShell")
}

func getOutfile() string {
	rundir, found := os.LookupEnv("XDG_RUNTIME_DIR")

	if !found {
		rundir = "/tmp"
	}

	return filepath.Join(rundir, "ags.js")
}

func getAppEntry(dir string) string {
	infile := filepath.Join(dir, "app")
	valid := []string{"js", "ts", "jsx", "tsx"}

	app := lib.Some(valid, func(ext string) bool {
		_, err := os.Stat(infile + "." + ext)
		return !os.IsNotExist(err)
	})

	if !app {
		msg := "no such file or directory: " +
			fmt.Sprintf("\"%s\"\n", lib.Cyan(dir+"/app")) +
			lib.Magenta("tip: ") + "valid names are: "
		for _, v := range valid {
			msg = msg + fmt.Sprintf(` "%s"`, lib.Cyan("app."+v))
		}
		lib.Err(msg)
	}

	return infile
}

func run(infile, dir string) {
	outfile := getOutfile()
	lib.Bundle(dir, infile, outfile)

	if gtk4 {
		os.Setenv("LD_PRELOAD", gtk4LayerShell)
	}

	gjs := lib.Exec("gjs", "-m", outfile)
	gjs.Stdout = os.Stdout
	gjs.Stderr = os.Stderr
	gjs.Stdin = os.Stdin
	gjs.Dir = dir

	// TODO: watch and restart
	if err := gjs.Run(); err != nil {
		lib.Err(err)
	}
}
