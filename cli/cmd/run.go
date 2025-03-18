package cmd

import (
	"ags/lib"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"

	"github.com/spf13/cobra"
)

var (
	targetDir string
	logFile   string
	args      []string
)

var runCommand = &cobra.Command{
	Use:     "run [file]",
	Short:   "Run an app",
	Example: "  run app.ts --define DEBUG=true",
	Args:    cobra.ArbitraryArgs,
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
				run(getAppEntry(path), "")
			} else {
				run(path, "")
			}

		} else {
			run(getAppEntry(targetDir), targetDir)
		}
	},
}

func init() {
	f := runCommand.Flags()
	f.StringVarP(&targetDir, "directory", "d", defaultConfigDir(),
		`directory to search for an "app" entry file
when no positional argument is given
`+"\b")

	f.StringSliceVar(&defines, "define", []string{}, "replace global identifiers with constant expressions")
	f.StringArrayVar(&alias, "alias", []string{}, "alias packages")
	f.StringArrayVarP(&args, "arg", "a", []string{}, "cli args to pass to gjs")
	f.UintVarP(&gtkVersion, "gtk", "g", 0, "gtk version")
	f.StringVar(&logFile, "log-file", "", "file to redirect the stdout of gjs to")
	f.MarkHidden("package")
	f.MarkHidden("alias")
}

func getOutfile() string {
	rundir, found := os.LookupEnv("XDG_RUNTIME_DIR")

	if !found {
		rundir = "/tmp"
	}

	return filepath.Join(rundir, "ags.js")
}

func getAppEntry(dir string) string {
	path, err := filepath.Abs(dir)
	if err != nil {
		lib.Err(err)
	}

	infile := filepath.Join(path, "app")
	valid := []string{"js", "ts", "jsx", "tsx"}

	app := slices.ContainsFunc(valid, func(ext string) bool {
		_, err := os.Stat(infile + "." + ext)
		return !os.IsNotExist(err)
	})

	if !app {
		msg := "no such file or directory: " +
			fmt.Sprintf("\"%s\"\n", lib.Cyan(dir+"/app")) +
			lib.Cyan("tip: ") + "valid names are: "
		for _, v := range valid {
			msg = msg + fmt.Sprintf(` "%s"`, lib.Cyan("app."+v))
		}
		lib.Err(msg)
	}

	return infile
}

func logging() (io.Writer, io.Writer, *os.File) {
	if logFile == "" {
		return os.Stdout, os.Stderr, nil
	}

	lib.Mkdir(filepath.Dir(logFile))
	file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		lib.Err(err)
	}

	return io.MultiWriter(os.Stdout, file), io.MultiWriter(os.Stderr, file), file
}

func run(infile string, rootdir string) {
	if gtkVersion == 0 {
		gtkVersion = inferGtkVersion(infile)
	}

	outfile := getOutfile()

	lib.Bundle(lib.BundleOpts{
		Infile:           infile,
		Outfile:          outfile,
		Defines:          defines,
		Alias:            alias,
		GtkVersion:       gtkVersion,
		WorkingDirectory: rootdir,
	})

	if gtkVersion == 4 {
		os.Setenv("LD_PRELOAD", gtk4LayerShell)
	}

	args = append([]string{"-m", outfile}, args...)
	stdout, stderr, file := logging()
	gjs := lib.Exec("gjs", args...)
	gjs.Stdin = os.Stdin
	gjs.Dir = filepath.Dir(infile)

	gjs.Stdout = stdout
	gjs.Stderr = stderr

	// TODO: watch and restart
	if err := gjs.Run(); err != nil {
		lib.Err(err)
	}

	if file != nil {
		file.Close()
	}
}
