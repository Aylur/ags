package cmd

import (
	"ags/lib"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/cobra"
)

var (
	gtk4      bool
	targetDir string
	logFile   string
	args      []string
	watch     bool
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
	f.BoolVar(&watch, "watch", false, "restart gjs on file changes")
	f.StringVarP(&targetDir, "directory", "d", defaultConfigDir(),
		`directory to search for an "app" entry file
when no positional argument is given
`+"\b")

	f.StringArrayVarP(&args, "arg", "a", []string{}, "cli args to pass to gjs")
	f.StringVar(&tsconfig, "tsconfig", "", "path to tsconfig.json")
	f.StringVar(&logFile, "log-file", "", "file to redirect the stdout of gjs to")
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

func run(infile string) {
	outfile := getOutfile()
	lib.Bundle(infile, outfile, tsconfig, "")

	if gtk4 {
		os.Setenv("LD_PRELOAD", gtk4LayerShell)
	}

	args = append([]string{"-m", outfile}, args...)
	stdout, stderr, file := logging()
	if file != nil {
		defer file.Close()
	}

	var gjs *exec.Cmd
	gjsStart := func() (*exec.Cmd, error) {
		if gjs != nil {
			if err := gjs.Process.Kill(); err != nil {
				log.Printf("Failed to kill process: %v", err)
			}
			_ = gjs.Wait()
		}

		gjs = lib.Exec("gjs", args...)
		gjs.Stdin = os.Stdin
		gjs.Dir = filepath.Dir(infile)

		gjs.Stdout = stdout
		gjs.Stderr = stderr

		err := gjs.Start()

		return gjs, err
	}

	if err := watchRun(gjsStart); err != nil {
		lib.Err(err)
	}
}

func watchRun(gjsStart func() (*exec.Cmd, error)) error {
	cmd, err := gjsStart()
	if err != nil {
		return err
	}
	if !watch {
		return cmd.Wait()
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer watcher.Close()

	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				log.Println("event:", event)
				if event.Has(fsnotify.Write) {
					log.Println("modified file:", event.Name)
					_, _ = gjsStart()
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("error:", err)
			}
		}
	}()

	err = watcher.Add(targetDir)
	if err != nil {
		return err
	}

	// Block main goroutine forever.
	<-make(chan struct{})

	return nil
}
