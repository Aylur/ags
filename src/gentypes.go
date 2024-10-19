package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

var tsForGir = "@ts-for-gir/cli@4.0.0-beta.15"

func girDirectories() []string {
	dataDirs := append([]string{
		"/usr/local/share",
		"/usr/share",
		"/usr/share/*",
	}, strings.Split(os.Getenv("NIX_GI_DIRS"), ":")...)

	return Map(dataDirs, func(dir string) string {
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
				fmt.Printf("\r%s Generating types, this might take a while...", Cyan(c))
				time.Sleep(time.Second / 10)
			}
		}
	}
}

func GenTypes() error {
	Mkdir(*Opts.config)

	npx, err := exec.LookPath("npx")
	if err != nil {
		return err
	}

	flags := []string{
		"-y", tsForGir, "generate",
		"--ignoreVersionConflicts",
		"--outdir", filepath.Join(*Opts.config, "@girs"),
	}

	for _, path := range girDirectories() {
		flags = append(flags, "-g", path)
	}

	HideCursor()

	cmd := exec.Command(npx, flags...)

	stopChan := make(chan bool)
	go spinner(stopChan)

	err = cmd.Run()
	stopChan <- true

	ShowCursor()

	return err
}
