package cmd

import (
	"ags/lib"
	"fmt"

	"github.com/spf13/cobra"
)

var reqCommand = &cobra.Command{
	Use:   "request [message]",
	Short: "Send a request to an instance",
	Args:  cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		out := lib.SendRequest(instance, args)
		if out != "" {
			fmt.Println(out)
		}
	},
}

func init() {
	f := reqCommand.Flags()
	f.StringVarP(&instance, "instance", "i", "ags", "name of the instance")
}
