package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"ags/lib"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/spf13/cobra"
)

var (
	defines       []string
	usePackage    bool
	minify        bool
	gtkVersion    int
	workingDir    string
	sourceMapOpt  string
	sourceMapOpts = map[string]api.SourceMap{
		"bundle": api.SourceMapInline,
		"split":  api.SourceMapLinked,
		"none":   api.SourceMapNone,
	}
)

var bundleCommand = &cobra.Command{
	Use:     "bundle [entryfile] [outfile]",
	Short:   "Bundle an app",
	Example: `  bundle app.ts my-shell -d "DATADIR='/usr/share/my-shell'"`,
	Args:    cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		path, err := filepath.Abs(args[0])
		if err != nil {
			lib.Err(err)
		}

		outfile, err := filepath.Abs(args[1])
		if err != nil {
			lib.Err(err)
		}

		info, err := os.Stat(path)
		if err != nil {
			lib.Err(err)
		}

		sourceMap, ok := sourceMapOpts[sourceMapOpt]
		if !ok {
			var validKeys []string
			for key := range sourceMapOpts {
				validKeys = append(validKeys, fmt.Sprintf("'%s'", key))
			}
			validOptsString := strings.Join(validKeys, ", ")

			lib.Err(fmt.Errorf("sourcemap option must be one of: %s ('%s' provided)", validOptsString, sourceMapOpt))
		}

		opts := lib.BundleOpts{
			Outfile:          outfile,
			UsePackage:       usePackage,
			Defines:          defines,
			GtkVersion:       gtkVersion,
			WorkingDirectory: workingDir,
			Minify:           minify,
			SourceMap:        sourceMap,
		}

		if info.IsDir() {
			opts.Infile = getAppEntry(path)
		} else {
			opts.Infile = path
		}

		lib.Bundle(opts)
	},
}

func init() {
	f := bundleCommand.Flags()
	f.StringVarP(&workingDir, "root", "r", "", "root directory of the project")
	f.StringArrayVarP(&defines, "define", "d", []string{}, "replace global identifiers with constant expressions")
	f.BoolVarP(&usePackage, "package", "p", false, "use astal package as defined in package.json")
	f.IntVar(&gtkVersion, "gtk", 3, "gtk version")
	f.MarkHidden("gtk")
	f.BoolVar(&minify, "minify", false, "minify the output bundle")
	f.StringVar(&sourceMapOpt, "sourcemap", "bundle", "what to do with the source map (valid options are: 'bundle', 'split', 'none')")
}
