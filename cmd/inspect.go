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
		instance, _ := cmd.Flags().GetString("instance")
		lib.Astal("--instance", instance, "--inspector")
	},
}

func init() {
	lib.AddInstanceFlag(inspectCommand)
}
