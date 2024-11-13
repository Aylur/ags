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
	ignoreModules  []string
	updateTsconfig bool
)

var typesCommand = &cobra.Command{
	Use:     "types [pattern]",
	Short:   "Generate TypeScript types",
	Args:    cobra.MaximumNArgs(1),
	Example: `  ags types Astal* --ignore Gtk3 --ignore Astal3`,
	Run: func(cmd *cobra.Command, args []string) {
		if updateTsconfig {
			lib.WriteFile(targetDir+"/tsconfig.json", lib.GetTsconfig(targetDir))

			envdts := targetDir + "/env.d.ts"
			if !lib.FileExists(envdts) {
				lib.WriteFile(envdts, getDataFile("env.d.ts"))
			}
		}

		if len(args) > 0 {
			genTypes(targetDir, args[0])
		} else {
			genTypes(targetDir, "*")
		}
	},
}

func init() {
	f := typesCommand.Flags()

	f.BoolVar(&updateTsconfig, "tsconfig", false, "update tsconfig.json")
	f.StringVarP(&targetDir, "directory", "d", defaultConfigDir(), "target directory")
	f.StringArrayVarP(&ignoreModules, "ignore", "i", []string{}, "modules that should be ignored")
}

func girDirectories() []string {
	dataDirs := append([]string{
		"/usr/local/share",
		"/usr/share",
		"/usr/share/*",
	}, strings.Split(os.Getenv("NIX_GI_DIRS"), ":")...)

	return lib.Map(dataDirs, func(dir string) string {
		return filepath.Join(dir, "gir-1.0")
	})
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

func genTypes(configDir, pattern string) {
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

	for _, path := range girDirectories() {
		flags = append(flags, "-g", path)
	}

	hideCursor()

	cmd := exec.Command(npx, flags...)

	stopChan := make(chan bool)
	go spinner(stopChan)

	err = cmd.Run()
	stopChan <- true

	showCursor()

	if err != nil {
		lib.Err("type generation failed, try running\n" +
			lib.Yellow(npx+" "+strings.Join(flags, " ")))
	}
}
