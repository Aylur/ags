import Astal from "gi://AstalIO"
import Gio from "gi://Gio?version=2.0"

export function readFile(path: string): string {
    return Astal.read_file(path) || ""
}

export function readFileAsync(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        Astal.read_file_async(path, (_, res) => {
            try {
                resolve(Astal.read_file_finish(res) || "")
            } catch (error) {
                reject(error)
            }
        })
    })
}

export function writeFile(path: string, content: string): void {
    Astal.write_file(path, content)
}

export function writeFileAsync(path: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        Astal.write_file_async(path, content, (_, res) => {
            try {
                resolve(Astal.write_file_finish(res))
            } catch (error) {
                reject(error)
            }
        })
    })
}

export function monitorFile(
    path: string,
    callback: (file: string, event: Gio.FileMonitorEvent) => void,
): Gio.FileMonitor {
    return Astal.monitor_file(path, (file: string, event: Gio.FileMonitorEvent) => {
        callback(file, event)
    })!
}
