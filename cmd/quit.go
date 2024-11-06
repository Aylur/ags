package cmd

import (
	"ags/lib"

	"github.com/spf13/cobra"
)

var quitCommand = &cobra.Command{
	Use:   "quit",
	Short: "Quit an instances",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		instance, _ := cmd.Flags().GetString("instance")
		lib.Astal("--quit", "--instance", instance)
	},
}

func init() {
	lib.AddInstanceFlag(quitCommand)
}
