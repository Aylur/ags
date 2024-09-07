package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if *Opts.help {
		PrintHelp()
		return
	}

	if *Opts.version {
		PrintVersion()
		return
	}

	if *Opts.list {
		List()
		return
	}

	if *Opts.quit {
		Quit()
		return
	}

	if *Opts.message != "" {
		Message()
		return
	}

	if *Opts.inspector {
		Inspector()
		return
	}

	if *Opts.toggleWindow != "" {
		ToggleWindow()
		return
	}

	if *Opts.init {
		InitConfig()
		return
	}

	if *Opts.genTypes {
		GenTypes()
		return
	}

	if *Opts.bundle {
		bundle()
		return
	}

	run()
}

func getEntry() (string, string) {
	rundir, found := os.LookupEnv("XDG_RUNTIME_DIR")

	if !found {
		rundir = "/tmp"
	}

	infile := filepath.Join(*Opts.config, "app")
	outfile := filepath.Join(rundir, "ags.js")

	valid := []string{"js", "ts", "jsx", "tsx"}

	app := Some(valid, func(ext string) bool {
		_, err := os.Stat(infile + "." + ext)
		return !os.IsNotExist(err)
	})

	if !app {
		msg := "no such file or directory: " +
			fmt.Sprintf("\"%s\"\n", Cyan(*Opts.config+"/app")) +
			Magenta("tip: ") + "valid names are: "
		for _, v := range valid {
			msg = msg + fmt.Sprintf(` "%s"`, Cyan("app."+v))
		}
		Err(msg)
	}

	return infile, outfile
}

func bundle() {
	infile, _ := getEntry()
	cwd, _ := os.Getwd()
	outfile := filepath.Join(cwd, "ags.js")
	Build(infile, outfile)
	fmt.Println(Green("project bundled") + " at " + Cyan(outfile))
}

func run() {
	infile, outfile := getEntry()
	Build(infile, outfile)
	cmd := Exec("gjs", "-m", outfile)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	cmd.Dir = *Opts.config

	// TODO: watch and restart
	if err := cmd.Run(); err != nil {
		Err(err)
	}
}
