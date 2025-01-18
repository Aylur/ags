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
	initDirectory string
)

var initCommand = &cobra.Command{
	Use:   "init",
	Short: "Initialize a project directory",
	Long: `Initialize a project directory by setting up files needed by TypeScript,
generating types and setting up a basic bar example`,
	Args: cobra.NoArgs,
	Run:  initConfig,
}

func init() {
	f := initCommand.Flags()

	f.IntVarP(&gtkVersion, "gtk", "g", 3, "gtk version to use")
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

// TODO: interactive init, to ask for
// project dir
// project name
// gtk version
// eslint
// prettier or eslint stylistic
func initConfig(cmd *cobra.Command, args []string) {
	gtk := "gtk3"
	if gtkVersion == 4 {
		gtk = "gtk4"
	}

	initDir, err := filepath.Abs(initDirectory)
	if err != nil {
		lib.Err(err)
	}
	if info, err := os.Stat(initDir); err == nil && info.IsDir() && !force {
		lib.Err("could not initialize: " + lib.Cyan(initDir) + " already exists")
	}

	tsconf := strings.ReplaceAll(getDataFile("tsconfig.json"), "@ASTAL_GJS@", astalGjs)
	tsconf = strings.ReplaceAll(tsconf, "@GTK_VERSION@", gtk)
	pkgjson := strings.ReplaceAll(getDataFile("package.json"), "@ASTAL_GJS@", astalGjs)

	lib.Mkdir(initDir + "/widget")
	lib.Mkdir(initDir + "/node_modules")

	lib.WriteFile(initDir+"/.gitignore", getDataFile("gitignore"))
	lib.WriteFile(initDir+"/tsconfig.json", tsconf)
	lib.WriteFile(initDir+"/package.json", pkgjson)
	lib.WriteFile(initDir+"/env.d.ts", getDataFile("env.d.ts"))
	lib.WriteFile(initDir+"/style.scss", getDataFile("style.scss"))
	lib.WriteFile(initDir+"/widget/Bar.tsx", getDataFile(gtk+"/Bar.tsx"))
	lib.WriteFile(initDir+"/app.ts", getDataFile(gtk+"/app.ts"))
	lib.Ln(astalGjs, initDir+"/node_modules/astal")

	genTypes(initDir, "*", false)
	fmt.Println(lib.Green("project ready") + " at " + lib.Cyan(initDir))
}
