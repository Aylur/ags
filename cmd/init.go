package cmd

import (
	"ags/lib"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

var (
	force         bool
	gtk           int
	initDirectory string
)

var initCommand = &cobra.Command{
	Use:   "init",
	Short: "Initialize a project directory",
	Long:  "Initialize a project directory by setting up files needed by TypeScript, generating types and setting up a basic bar example",
	Args:  cobra.MaximumNArgs(1),
	Run:   initConfig,
}

func init() {
	f := initCommand.Flags()

	f.IntVarP(&gtk, "gtk", "g", 3, "use this gtk version")
	f.BoolVarP(&force, "force", "f", false, "override existing files")
	f.StringVarP(&initDirectory, "directory", "d", defaultConfigDir(), "target directory")
}

func getDataFile(name string) string {
	content, err := data.ReadFile("data/" + name)
	if err != nil {
		lib.Err(err)
	}
	return string(content)
}

func initConfig(cmd *cobra.Command, args []string) {
	if gtk != 3 {
		lib.Err("currently only gtk3 is supported")
	}

	var configDir string
	if len(args) > 0 {
		var err error
		configDir, err = filepath.Abs(args[0])
		if err != nil {
			lib.Err(err)
		}
	} else {
		configDir = defaultConfigDir()
	}

	tsconfig := getDataFile("tsconfig.json")
	envdts := getDataFile("env.d.ts")
	stylescss := getDataFile("style.scss")
	bartsx := getDataFile("gtk3/Bar.tsx")
	appts := getDataFile("gtk3/app.ts")

	if info, err := os.Stat(configDir); err == nil && info.IsDir() && !force {
		lib.Err("could not initialize: " + lib.Cyan(configDir) + " already exists")
	}

	tsconf := strings.ReplaceAll(tsconfig, "@ASTAL_GJS@", astalGjs)
	tsconf = strings.ReplaceAll(tsconf, "@GTK_VERSION@", "gtk3") // TODO: gtk4 flag
	lib.Mkdir(configDir + "/widget")

	lib.WriteFile(configDir+"/.gitignore", "@girs/\nnode_modules/")
	lib.WriteFile(configDir+"/tsconfig.json", tsconf)
	lib.WriteFile(configDir+"/env.d.ts", envdts)
	lib.WriteFile(configDir+"/style.scss", stylescss)
	lib.WriteFile(configDir+"/widget/Bar.tsx", bartsx)
	lib.WriteFile(configDir+"/app.ts", appts)

	if err := genTypes(configDir, "*"); err != nil {
		lib.Err(err)
	}

	fmt.Println(lib.Green("project ready") + " at " + lib.Cyan(configDir))
}
