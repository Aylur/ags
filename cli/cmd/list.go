package cmd

import (
	"ags/lib"

	"github.com/spf13/cobra"
)

var listCommand = &cobra.Command{
	Use:   "list",
	Short: "List running instances",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		lib.Astal("--list")
	},
}
