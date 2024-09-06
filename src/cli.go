package main

import (
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	flag "github.com/spf13/pflag"
)

type cliOptions struct {
	instance     *string
	config       *string
	toggleWindow *string
	message      *string
	help         *bool
	version      *bool
	inspector    *bool
	list         *bool
	quit         *bool
	init         *bool
	genTypes     *bool
}

var (
	//go:embed version
	version string

	//go:embed data/version.js
	versionscript string

	r = "\x1b[0m"
)

var Opts = func() cliOptions {
	cli := flag.NewFlagSet("argv", flag.ContinueOnError)
	dotconf, _ := os.UserConfigDir()
	config := filepath.Join(dotconf, "ags")

	opts := cliOptions{
		instance:     cli.StringP("instance", "i", "astal", ""),
		config:       cli.StringP("config", "c", config, ""),
		toggleWindow: cli.StringP("toggle", "t", "", ""),
		message:      cli.StringP("message", "m", "", ""),
		help:         cli.BoolP("help", "h", false, ""),
		version:      cli.BoolP("version", "v", false, ""),
		inspector:    cli.BoolP("inspector", "I", false, ""),
		list:         cli.BoolP("list", "l", false, ""),
		quit:         cli.BoolP("quit", "q", false, ""),
		genTypes:     cli.BoolP("generate", "g", false, ""),
		init:         cli.Bool("init", false, ""),
	}

	cli.Usage = PrintHelp
	if err := cli.Parse(os.Args[1:]); err != nil {
		Err(err)
	}

	var err error
	*opts.config, err = filepath.Abs(*opts.config)
	if err != nil {
		Err(err)
	}

	return opts
}()

func PrintHelp() {
	section := func(str string) string {
		return Green(str) + ":\n"
	}

	opt := func(short string, long string, desc string) string {
		return Blue("    -"+short) + ", " + Blue("--"+long) + desc + "\n"
	}

	fmt.Print(section("usage") +
		"    " + os.Args[0] + Blue(" [options]\n") +
		section("options") +
		opt("h", "help", "          Print this help") +
		opt("v", "version", "       Print version number") +
		opt("c", "config", "        Configuration directory") +
		opt("i", "instance", "      Name of the instance") +
		opt("l", "list", "          List running instances") +
		opt("q", "quit", "          Quit an instance") +
		opt("m", "message", "       Send message to an instance") +
		opt("I", "inspector", "     Open up Gtk debug tool") +
		opt("t", "toggle", "        Show or hide a window") +
		opt("g", "generate", "      Generate TypeScript types") +
		"        " + Blue("--init") + "          Initialize the configuration directory\n")

	os.Exit(0)
}

func PrintVersion() {
	fmt.Println("ags: ", Yellow(strings.TrimSpace(version)))
	out, _ := Exec("gjs", "-c", versionscript).Output()
	fmt.Print(string(out))
	os.Exit(0)
}
