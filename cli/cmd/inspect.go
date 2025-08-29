package cmd

import (
	"ags/lib"

	"github.com/spf13/cobra"
)

var inspectCommand = &cobra.Command{
	Use:   "inspect",
	Short: "Open up Gtk debug tool",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		lib.OpenInspector(instance)
	},
}

func init() {
	f := inspectCommand.Flags()
	f.StringVarP(&instance, "instance", "i", "ags", "name of the instance")
}
