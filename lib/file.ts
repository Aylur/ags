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

// make sure monitor file ref count does not drop to 0
const monitorFiles = new Set<Gio.FileMonitor>()

export function monitorFile(
    path: string,
    callback: (file: string, event: Gio.FileMonitorEvent) => void,
): Gio.FileMonitor {
    const monitoredFile = Gio.File.new_for_path(path)

    const mon = monitoredFile.monitor(
        Gio.FileMonitorFlags.WATCH_HARD_LINKS |
            Gio.FileMonitorFlags.WATCH_MOUNTS |
            Gio.FileMonitorFlags.WATCH_MOVES,
        null,
    )

    mon.connect("changed", (_, file, _file, event) => {
        const path = file.get_path()
        if (path) {
            if (event === Gio.FileMonitorEvent.CREATED && path) {
                monitorFile(path, callback)
            }

            if (event === Gio.FileMonitorEvent.DELETED && path === monitoredFile.get_path()) {
                mon.cancel()
            }

            callback(path, event)
        }
    })

    if (GLib.file_test(path, GLib.FileTest.IS_DIR)) {
        const enumerator = monitoredFile.enumerate_children(
            Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
            Gio.FileQueryInfoFlags.NONE,
            null,
        )

        let i: Gio.FileInfo | null
        while ((i = enumerator.next_file(null)) !== null) {
            if (i.get_file_type() == Gio.FileType.DIRECTORY) {
                const filepath = monitoredFile.get_child(i.get_name()).get_path()
                if (filepath != null) {
                    const m = monitorFile(filepath, callback)
                    mon.connect("notify::cancelled", () => {
                        m.cancel()
                    })
                }
            }
        }
    }

    monitorFiles.add(mon)
    mon.connect("notify::cancelled", () => {
        print(path, "cancelled")
        monitorFiles.delete(mon)
    })
    return mon
}
