package cmd

import (
	"ags/lib"

	"github.com/spf13/cobra"
)

var toggleCommand = &cobra.Command{
	Use:   "toggle [name]",
	Short: "Toggle visibility of a Window",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		lib.ToggleWindow(instance, args[0])
	},
}

func init() {
	f := toggleCommand.Flags()
	f.StringVarP(&instance, "instance", "i", "ags", "name of the instance")
}
