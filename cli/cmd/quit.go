package cmd

import (
	"ags/lib"

	"github.com/spf13/cobra"
)

var quitCommand = &cobra.Command{
	Use:   "quit",
	Short: "Quit an instance",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		lib.QuitInstance(instance)
	},
}

func init() {
	f := quitCommand.Flags()
	f.StringVarP(&instance, "instance", "i", "ags", "name of the instance")
}
