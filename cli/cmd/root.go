package cmd

import (
	"embed"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var (
	version        string
	data           embed.FS
	gtk4LayerShell string
	tsForGir       string
	gtkVersion     uint
	agsJsPackage   string
	instance       string
	defines        []string
	alias          []string
	workingDir     string
	bash           string
	gjs            string
)

var rootCmd = &cobra.Command{
	Use:   "ags",
	Short: "Scaffolding CLI tool for Astal+TypeScript projects.",
	Args:  cobra.NoArgs,
}

type Variables struct {
	Version        string
	Data           embed.FS
	Gtk4LayerShell string
	AgsJsPackage   string
	TsForGir       string
	Bash           string
	Gjs            string
}

func Initialize(vars Variables) {
	version = vars.Version
	data = vars.Data
	gtk4LayerShell = vars.Gtk4LayerShell
	agsJsPackage = vars.AgsJsPackage
	tsForGir = vars.TsForGir
	bash = vars.Bash
	gjs = vars.Gjs

	rootCmd.Version = version
}

func init() {
	rootCmd.CompletionOptions.HiddenDefaultCmd = true
	cobra.EnableCommandSorting = false

	rootCmd.AddCommand(runCommand)
	rootCmd.AddCommand(reqCommand)
	rootCmd.AddCommand(listCommand)
	rootCmd.AddCommand(inspectCommand)
	rootCmd.AddCommand(toggleCommand)
	rootCmd.AddCommand(quitCommand)
	rootCmd.AddCommand(typesCommand)
	rootCmd.AddCommand(bundleCommand)
	rootCmd.AddCommand(initCommand)
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}

	help, _ := rootCmd.Flags().GetBool("help")
	ver, _ := rootCmd.Flags().GetBool("version")

	if help || ver {
		os.Exit(0)
	}
}

func defaultConfigDir() string {
	dotconf, _ := os.UserConfigDir()
	return filepath.Join(dotconf, "ags")
}
