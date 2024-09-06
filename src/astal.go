package main

import "os"

// TODO: reimplement using DBus directly
func astal(args ...string) {
	args = append(args, "--instance", *Opts.instance)
	cmd := Exec("astal", args...)
	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout
	cmd.Run()
	os.Exit(0)
}

func List() {
	astal("--list")
}

func Quit() {
	astal("--quit")
}

func Message() {
	astal("--message", *Opts.message)
}

func Inspector() {
	astal("--inspector")
}

func ToggleWindow() {
	astal("--toggle-window", *Opts.toggleWindow)
}
