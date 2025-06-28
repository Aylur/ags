package cmd

import (
	"ags/lib"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var (
	ignoreModules []string
	updatePkg     bool
	verbose       bool
)

var typesCommand = &cobra.Command{
	Use:     "types [pattern]",
	Short:   "Generate TypeScript types",
	Args:    cobra.MaximumNArgs(1),
	Example: `  ags types Astal* --ignore Gtk3 --ignore Astal3`,
	Run: func(cmd *cobra.Command, args []string) {
		if updatePkg {
			lib.WriteFile(targetDir+"/tsconfig.json", lib.GetTsconfig(targetDir, 0))

			lib.Mkdir(targetDir + "/node_modules")
			lib.Rm(targetDir + "/node_modules/ags")
			lib.Ln(agsJsPackage, targetDir+"/node_modules/ags")

			if envdts := targetDir + "/env.d.ts"; !lib.FileExists(envdts) {
				lib.WriteFile(envdts, getDataFile("env.d.ts"))
			}
		}

		if len(args) > 0 {
			genTypes(targetDir, args[0], verbose)
		} else {
			genTypes(targetDir, "*", verbose)
		}
	},
}

func init() {
	f := typesCommand.Flags()

	f.BoolVarP(&verbose, "verbose", "v", false, "print ts-for-gir logs")
	f.BoolVarP(&updatePkg, "update", "u", false, "update tsconfig and linked ags package")
	f.StringVarP(&targetDir, "directory", "d", defaultConfigDir(), "target directory")
	f.StringArrayVarP(&ignoreModules, "ignore", "i", []string{}, "modules that should be ignored")
}

func spinner(stopChan chan bool) {
	chars := []string{"⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"}

	for {
		select {
		case <-stopChan:
			fmt.Print("\r\033[K")
			return
		default:
			for _, c := range chars {
				fmt.Printf("\r%s Generating types, this might take a while...", lib.Cyan(c))
				time.Sleep(time.Second / 10)
			}
		}
	}
}

func hideCursor() {
	fmt.Print("\033[?25l")
}

func showCursor() {
	fmt.Print("\033[?25h")
}

func genTypes(configDir, pattern string, verbose bool) {
	lib.Mkdir(configDir)

	npx, err := exec.LookPath("npx")
	if err != nil {
		lib.Err(err)
	}

	flags := []string{
		"-y", tsForGir, "generate", pattern,
		"--ignoreVersionConflicts",
		"--outdir", filepath.Join(configDir, "@girs"),
	}

	dataDirs := append([]string{
		"/usr/local/share/gir-1.0",
		"/usr/share/gir-1.0",
		"/usr/share/*/gir-1.0",
	}, strings.Split(os.Getenv("EXTRA_GIR_DIRS"), ":")...)

	for _, path := range dataDirs {
		flags = append(flags, "-g", path)
	}

	hideCursor()

	cmd := exec.Command(npx, flags...)

	if verbose {
		fmt.Fprintln(os.Stderr, lib.Blue("executing: ")+strings.Join(cmd.Args, " "))

		cmd.Stderr = os.Stderr
		cmd.Stdout = os.Stdout
		err = cmd.Run()
	} else {
		stopChan := make(chan bool)
		go spinner(stopChan)
		err = cmd.Run()
		stopChan <- true
		showCursor()
	}

	if err != nil {
		lib.Err("type generation failed, try running\n" +
			lib.Yellow(npx+" "+strings.Join(flags, " ")))
	}
}
