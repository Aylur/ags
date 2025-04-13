package lib

import "os"

// TODO: reimplement using DBus directly
func Astal(args ...string) {
	cmd := Exec("astal", args...)
	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout
	if err := cmd.Run(); err != nil {
		os.Exit(1)
	}
}
