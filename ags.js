#!@GJS@ -m
import { exit, programArgs, programInvocationName } from "system"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import Astal from "gi://Astal"
import Gtk from "gi://Gtk"

const ASTAL_GJS = "@ASTAL_GJS@"
const ESBUILD = "@ESBUILD@"
const NPX = "@NPX@"
const VERSION = "@VERSION@"
const XDG_DATA_DIRS = "@XDG_DATA_DIRS@"
const RUNDIR = `${GLib.get_user_runtime_dir()}/ags`
const CONFIG = `${GLib.get_user_config_dir()}/ags`

const help = `
USAGE:
    ${programInvocationName} [OPTIONS] message

OPTIONS:
    -h, --help               Print this help and exit
    -v, --version            Print version number and exit
    -l, --list               List running Astal instances and exit
    -q, --quit               Quit an Astal.Application instance
    -i, --instance           Instance name of the Astal instance
    -m, --message            Send message to Astal instance
    -I, --inspector          Open up Gtk debug tool
    -t, --toggle-window      Show or hide a window
    -c, --config             Configuration directory. Default: ${CONFIG}
    -g, --generate-types     Generate TypeScript types and tsconfig.json
    --init                   Initialize the configuration directory
`

const baseconfig = `
import { App, Variable, Astal, Gtk } from "astal"

const time = Variable("").poll(1000, "date")

/** @param {number} monitor */
function Bar(monitor = 0) {
    return <window
        monitor={monitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={Astal.WindowAnchor.TOP
            | Astal.WindowAnchor.LEFT
            | Astal.WindowAnchor.RIGHT}
        application={App}>
        <centerbox>
            <button
                onClicked="echo hello"
                halign={Gtk.Align.START} >
                Welcome to AGS!
            </button>
            <box />
            <button
                onClick={() => print("hello")}
                halign={Gtk.Align.END} >
                <label label={time()} />
            </button>
        </centerbox>
    </window>
}

App.start({
    main() {
        Bar()
    }
})
`

/** @param {string} config */
function init(config) {
    if (GLib.file_test(config, GLib.FileTest.IS_DIR)) {
        printerr(`config directory ${config} already exists`)
        exit(1)
    }

    const gitignore = [
        "node_modules/",
        "tsconfig.json",
    ]

    if (!GLib.file_test(config, GLib.FileTest.EXISTS))
        Gio.File.new_for_path(config).make_directory_with_parents(null)

    Astal.write_file(`${config}/.gitignore`, gitignore.join("\n").trim())
    Astal.write_file(`${config}/config.js`, baseconfig.trim())

    generateTypes(config)
    print(`Config setup at ${config}`)
}

/**
 * @param {any[]} acc
 * @param {any} item
 */
function duplicates(acc, item) {
    return acc.includes(item) ? acc : [item, ...acc]
}

/** @param {string} config */
function generateTypes(config) {
    if (!GLib.file_test(config, GLib.FileTest.EXISTS))
        Gio.File.new_for_path(config).make_directory_with_parents(null)

    const tsconfig = GLib.file_test(`${config}/tsconfig.json`, GLib.FileTest.EXISTS)
        ? JSON.parse(Astal.read_file(`${config}/tsconfig.json`) || "{}")
        : {}

    tsconfig.compilerOptions = Object.assign(tsconfig?.compilerOptions || {}, {
        module: "ESNext",
        outDir: "dist",
        checkJs: tsconfig?.compilerOptions?.checkJs ?? true,
        allowJs: tsconfig?.compilerOptions?.allowJs ?? true,
        jsx: "react-jsx",
        jsxImportSource: `${ASTAL_GJS}/src/jsx`,
        paths: Object.assign(tsconfig?.compilerOptions?.paths || {}, {
            astal: [`${ASTAL_GJS}/index.ts`],
        }),
    })

    tsconfig.include = [...(tsconfig?.include || []), "./node_modules/@girs"]
        .reduce(duplicates, [])

    Astal.write_file(
        `${config}/tsconfig.json`,
        JSON.stringify(tsconfig, null, 4),
    )

    const dataDirs = [
        "/usr/local/share",
        "/usr/share",
        "/usr/share/*",
        ...XDG_DATA_DIRS.split(":"),
    ]

    const girDirectories = dataDirs
        .map(dir => `${dir}/gir-1.0`)
        .filter(dir => GLib.file_test(dir, GLib.FileTest.IS_DIR))
        .reduce(duplicates, [])

    const gencmd = [
        NPX, "@ts-for-gir/cli", "generate",
        "--outdir", `${config}/node_modules/@girs`,
        "--promisify",
        ...girDirectories.flatMap(path => ["-g", path]),
    ].flat()

    try {
        print("Generating types, this might take a while...")
        Gio.Subprocess.new(gencmd, Gio.SubprocessFlags.STDIN_INHERIT)
            .wait(null)
    }
    catch (error) {
        console.error(error)
    }
}

/** @param {string} dir */
async function run(dir) {
    const config = `${dir}/config`
    const outfile = `${RUNDIR}/config.js`
    const outcss = `${RUNDIR}/config.css`
    const tsconfig = `${RUNDIR}/tsconfig.json`
    const formats = ["js", "jsx", "ts", "tsx"]

    if (!formats.some(f => GLib.file_test(`${config}.${f}`, GLib.FileTest.EXISTS))) {
        printerr(`Could not resolve ${config}`)
        exit(1)
    }

    try {
        if (GLib.file_test(outfile, GLib.FileTest.EXISTS))
            Gio.File.new_for_path(outfile).delete(null)

        if (GLib.file_test(outcss, GLib.FileTest.EXISTS))
            Gio.File.new_for_path(outcss).delete(null)

        if (!GLib.file_test(RUNDIR, GLib.FileTest.EXISTS))
            Gio.File.new_for_path(RUNDIR).make_directory_with_parents(null)

        Astal.write_file(tsconfig, JSON.stringify({
            compilerOptions: {
                target: "ESNext",
                module: "ESNext",
                lib: ["ESNext"],
                moduleResolution: "Bundler",
                skipLibCheck: true,
                allowJs: true,
                jsx: "react-jsx",
                jsxImportSource: `${ASTAL_GJS}/src/jsx`,
                paths: {
                    "astal/*": [`${ASTAL_GJS}/src/*`],
                    "astal": [`${ASTAL_GJS}/index.ts`],
                },
            },
        }))

        Astal.Process.execv([
            ESBUILD,
            "--bundle", config,
            `--tsconfig=${tsconfig}`,
            `--outdir=${RUNDIR}`,
            "--target=chrome98", // nested css
            "--format=esm",
            "--external:console",
            "--external:system",
            "--external:resource://*",
            "--external:gi://*",
            "--external:file://*",
            "--loader:.js=jsx",
        ])
    }
    catch (error) {
        printerr(error)
    }

    try {
        GLib.set_prgname("ags")
        Gtk.init(null)
        await import(`file://${outfile}`)
    }
    catch (error) {
        console.error(error)
    }
}

/** @param {Array<string>} args */
async function main(args) {
    const flags = {
        instance: "astal",
        config: CONFIG,
        inspector: false,
        quit: false,
        init: false,
        toggleWindow: "",
        genTypes: false,
        message: "",
    }

    for (let i = 0; i < args.length; ++i) {
        switch (args[i]) {
            case "-h":
            case "--help":
                return print(help.trim())

            case "-v":
            case "--version":
                print("ags:", VERSION)
                print("astal:", Astal.VERSION)
                return

            case "-l":
            case "--list":
                return print(Astal.Application.get_instances().join("\n"))

            case "-q":
            case "--quit":
                flags.quit = true
                break

            case "-i":
            case "--instance":
                flags.instance = args[++i]
                break

            case "-m":
            case "--message":
                flags.message = args[++i]
                break

            case "-I":
            case "--inspector":
                flags.inspector = true
                break

            case "-g":
            case "--generate-types":
                flags.genTypes = true
                break

            case "-t":
            case "--togge-window":
                flags.toggleWindow = args[++i]
                break

            case "-c":
            case "--config": {
                const path = args[++i]
                const config = path.startsWith(".")
                    ? `${GLib.getenv("PWD")}${path.slice(1)}`
                    : path

                flags.config = config.endsWith("/")
                    ? config.slice(0, -1)
                    : config
                break
            }
            case "--init":
                flags.init = true
                break

            default:
                printerr("unknown flag", args[i])
                exit(1)
                break
        }
    }

    const { config, instance, inspector, quit, toggleWindow, message } = flags

    if (args.length == 0)
        print(help.trim())

    if (quit)
        return Astal.Application.open_inspector(instance)

    if (inspector)
        return Astal.Application.open_inspector(instance)

    if (toggleWindow)
        return Astal.Application.toggle_window_by_name(instance, toggleWindow)

    if (flags.init)
        return init(config)

    if (flags.genTypes)
        return generateTypes(config)

    if (message) {
        try {
            return print(Astal.Application.send_message(instance, message))
        }
        catch (error) {
            printerr(error)
            exit(1)
        }
    }

    try {
        await run(config)
    }
    catch (error) {
        console.error(error)
        exit(1)
    }
}

try {
    main(programArgs)
}
catch (error) {
    console.error(error)
    exit(1)
}
