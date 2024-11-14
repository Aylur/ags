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
	Long: `Initialize a project directory by setting up files needed by TypeScript,
generating types and setting up a basic bar example`,
	Args: cobra.NoArgs,
	Run:  initConfig,
}

func init() {
	f := initCommand.Flags()

	f.IntVarP(&gtk, "gtk", "g", 3, "gtk version to use")
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
	// TODO: gtk4 template
	if gtk != 3 {
		lib.Err("currently only gtk3 is supported")
	}

	initDir, err := filepath.Abs(initDirectory)
	if err != nil {
		lib.Err(err)
	}
	if info, err := os.Stat(initDir); err == nil && info.IsDir() && !force {
		lib.Err("could not initialize: " + lib.Cyan(initDir) + " already exists")
	}

	tsconf := strings.ReplaceAll(getDataFile("tsconfig.json"), "@ASTAL_GJS@", astalGjs)
	tsconf = strings.ReplaceAll(tsconf, "@GTK_VERSION@", "gtk3")
	lib.Mkdir(initDir + "/widget")

	lib.WriteFile(initDir+"/.gitignore", "@girs/\nnode_modules/")
	lib.WriteFile(initDir+"/tsconfig.json", tsconf)
	lib.WriteFile(initDir+"/env.d.ts", getDataFile("env.d.ts"))
	lib.WriteFile(initDir+"/style.scss", getDataFile("style.scss"))
	lib.WriteFile(initDir+"/widget/Bar.tsx", getDataFile("gtk3/Bar.tsx"))
	lib.WriteFile(initDir+"/app.ts", getDataFile("gtk3/app.ts"))

	genTypes(initDir, "*")
	fmt.Println(lib.Green("project ready") + " at " + lib.Cyan(initDir))
}
