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
		cwd, _ := os.Getwd()
		outfile := filepath.Join(cwd, "ags.js")
		Build(getAppEntry(), outfile)
		fmt.Println(Green("project bundled") + " at " + Cyan(outfile))
		return
	}

	run()
}

func getOutfile() string {
	rundir, found := os.LookupEnv("XDG_RUNTIME_DIR")

	if !found {
		rundir = "/tmp"
	}

	return filepath.Join(rundir, "ags.js")
}

func getAppEntry() string {
	infile := filepath.Join(*Opts.config, "app")
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

	return infile
}

func run() {
	var infile string

	if len(Opts.args) > 0 {
		*Opts.config = filepath.Dir(Opts.args[0])
		infile = Opts.args[0]
	} else {
		infile = getAppEntry()
	}

	outfile := getOutfile()
	Build(infile, outfile)
	astalLib := "GI_TYPELIB_PATH=" + filepath.Join(astalGjs, "../../../lib64/girepository-1.0")
	cmd := Exec("gjs", "-m", outfile)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	cmd.Env = append(cmd.Environ(), astalLib)
	cmd.Dir = *Opts.config

	// TODO: watch and restart
	if err := cmd.Run(); err != nil {
		Err(err)
	}
}
