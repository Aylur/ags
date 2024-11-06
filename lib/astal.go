package lib

import (
	"os"

	"github.com/spf13/cobra"
)

// TODO: reimplement using DBus directly
func Astal(args ...string) {
	cmd := Exec("astal", args...)
	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout
	if err := cmd.Run(); err != nil {
		os.Exit(1)
	}
}

var instance string

func AddInstanceFlag(cmd *cobra.Command) {
	cmd.Flags().StringVarP(&instance, "instance", "i", "astal", "name of the instance")
}
