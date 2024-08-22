import Gio from "gi://Gio"
import GLib from "gi://GLib"
import Astal from "gi://Astal"
import { exit } from "system"
import { defaultConfigDir } from "@/config"
import { stdout } from "@/lib/console"

const TS_FOR_GIR = "@ts-for-gir/cli@4.0.0-beta.14"

function duplicates(acc: string[], item: string) {
    return acc.includes(item) ? acc : [item, ...acc]
}

export default async function generateTypes(config = defaultConfigDir, dontExit = false) {
    if (!GLib.file_test(config, GLib.FileTest.EXISTS))
        Gio.File.new_for_path(config).make_directory_with_parents(null)

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
        NPX, "-y", TS_FOR_GIR, "generate",
        "--ignoreVersionConflicts",
        "--outdir", `${config}/@girs`,
        ...girDirectories.flatMap(path => ["-g", path]),
    ].flat()

    stdout.puts("Generating types, this might take a while...\n")
    return new Promise(resolve => {
        Astal.Process.exec_asyncv(gencmd, (_, res) => {
            stdout.flush()
            try {
                resolve(Astal.Process.exec_asyncv_finish(res))
                if (!dontExit)
                    exit(0)
            } catch (error) {
                stdout.err(error)
                exit(1)
            }
        })
    })
}
