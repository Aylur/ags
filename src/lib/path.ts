import { fg } from "@/lib/colors"
import GLib from "gi://GLib"

const validExtensions = ["js", "ts", "tsx", "jsx"]
const validEntries = validExtensions.map(ext => `app.${ext}`)

export function path(config: string) {
    if (GLib.file_test(config, GLib.FileTest.IS_DIR)) {
        const entry = validEntries
            .map(f => `${config}/${f}`)
            .find(f => GLib.file_test(f, GLib.FileTest.EXISTS))

        if (!entry) {
            throw ("No entry file in directory. Valid entry file names are: "
                + validEntries.map(f => `${fg.white(f)}`).join(", "))
        }

        return {
            dir: config,
            file: GLib.path_get_basename(entry),
        }
    }

    if (validExtensions.some(ext => config.endsWith(ext))) {
        return {
            dir: GLib.path_get_dirname(config),
            file: GLib.path_get_basename(config)
        }
    }

    throw "No such file or directory."
}
