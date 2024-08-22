import GioUnix from "gi://GioUnix";
import Gio from "gi://Gio";
import { r, fg } from "./colors";
import GLib from "gi://GLib?version=2.0";

const _stdin = new Gio.DataInputStream({
    base_stream: new GioUnix.InputStream({
        fd: 0,
        close_fd: false
    })
})

const _stdout = new Gio.DataOutputStream({
    base_stream: new GioUnix.OutputStream({
        fd: 0,
        close_fd: false
    })
})

export const stdin = {
    read: () => _stdin.read_line_utf8(null)[0],
}

export const stdout = {
    puts: (...str: string[]) => _stdout.put_string(str.join(" "), null),
    flush: () => _stdout.flush(null),
    err: (...str: any[]) => printerr(
        `${fg.red("err:")}${r}`,
        ...str.map(s => s instanceof GLib.Error ? s.message : s)
    )
}
