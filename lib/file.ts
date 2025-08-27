import Gio from "gi://Gio"
import GLib from "gi://GLib"

export function readFile(file: string | Gio.File) {
    const f = typeof file === "string" ? Gio.File.new_for_path(file) : file

    const [, bytes] = f.load_contents(null)
    return new TextDecoder().decode(bytes)
}

export function readFileAsync(file: string | Gio.File): Promise<string> {
    const f = typeof file === "string" ? Gio.File.new_for_path(file) : file

    return new Promise((resolve, reject) => {
        f.load_contents_async(null, (_, res) => {
            try {
                const [success, bytes] = f.load_contents_finish(res)
                if (success) {
                    resolve(new TextDecoder().decode(bytes))
                } else {
                    const path = typeof file === "string" ? file : file.get_path()
                    reject(Error(`reading file ${path} was unsuccessful`))
                }
            } catch (error) {
                reject(error)
            }
        })
    })
}

export function writeFile(file: string | Gio.File, content: string): Gio.File {
    const gfile = typeof file === "string" ? Gio.File.new_for_path(file) : file
    const path = typeof file === "string" ? file : gfile.get_path()

    if (!path) throw Error("path is null")

    const dir = GLib.path_get_dirname(path)
    if (!GLib.file_test(dir, GLib.FileTest.IS_DIR)) {
        Gio.File.new_for_path(dir).make_directory_with_parents(null)
    }

    gfile.replace_contents(
        new TextEncoder().encode(content),
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null,
    )
    return gfile
}

export function writeFileAsync(file: string | Gio.File, content: string): Promise<Gio.File> {
    return new Promise((resolve, reject) => {
        const gfile = typeof file === "string" ? Gio.File.new_for_path(file) : file
        const path = typeof file === "string" ? file : gfile.get_path()

        if (!path) return reject(Error("path is null"))

        const dir = GLib.path_get_dirname(path)
        if (!GLib.file_test(dir, GLib.FileTest.IS_DIR)) {
            Gio.File.new_for_path(dir).make_directory_with_parents(null)
        }

        gfile.replace_contents_bytes_async(
            new GLib.Bytes(new TextEncoder().encode(content)),
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null,
            (_, res) => {
                try {
                    gfile.replace_contents_finish(res)
                    resolve(gfile)
                } catch (error) {
                    reject(error)
                }
            },
        )
    })
}

// TODO: monitor file
