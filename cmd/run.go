package cmd

import (
	"ags/lib"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var (
	gtk4      bool
	targetDir string
	args      []string
)

var runCommand = &cobra.Command{
	Use:   "run [file]",
	Short: "Run an app",
	Args:  cobra.ArbitraryArgs,
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
				run(getAppEntry(path))
			} else {
				run(path)
			}

		} else {
			run(getAppEntry(targetDir))
		}
	},
}

func init() {
	f := runCommand.Flags()
	f.BoolVar(&gtk4, "gtk4", false, "preload Gtk4LayerShell")
	f.StringVarP(&targetDir, "directory", "d", defaultConfigDir(),
		`directory to search for an "app" entry file
when no positional argument is given
`+"\b")

	f.StringArrayVarP(&args, "arg", "a", []string{}, "cli args to pass to gjs")
	f.StringVar(&tsconfig, "tsconfig", "", "path to tsconfig.json")
	f.MarkHidden("tsconfig")
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

func run(infile string) {
	outfile := getOutfile()
	lib.Bundle(infile, outfile, tsconfig, "")

	if gtk4 {
		os.Setenv("LD_PRELOAD", gtk4LayerShell)
	}

	args = append([]string{"-m", outfile}, args...)
	gjs := lib.Exec("gjs", args...)
	gjs.Stdout = os.Stdout
	gjs.Stderr = os.Stderr
	gjs.Stdin = os.Stdin
	gjs.Dir = filepath.Dir(infile)

	// TODO: watch and restart
	if err := gjs.Run(); err != nil {
		lib.Err(err)
	}
}
