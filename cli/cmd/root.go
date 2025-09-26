package cmd

import (
	"embed"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var (
	gtkVersion uint
	instance   string
	defines    []string
	alias      []string
	workingDir string
	env        Env
)

var rootCmd = &cobra.Command{
	Use:   "ags",
	Short: "Scaffolding CLI tool for Astal+TypeScript projects.",
	Args:  cobra.NoArgs,
}

type Env struct {
	Version        string
	Data           embed.FS
	Gtk4LayerShell string
	AgsJsPackage   string
	TSForGir       string
	Bash           string
	Gjs            string
	Cat            string
	Base64         string
}

func Initialize(_env Env) {
	env = _env
	rootCmd.Version = env.Version
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
