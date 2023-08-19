import Gtk from 'gi://Gtk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import { Command } from './widgets/shared.js';

export const USER = GLib.get_user_name();
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/${pkg.name}`;

export function readFile(path: string) {
    const f = Gio.File.new_for_path(path);
    const [, bytes] = f.load_contents(null);
    return new TextDecoder().decode(bytes);
}

export function readFileAsync(path: string): Promise<string> {
    const file = Gio.File.new_for_path(path);

    return new Promise((resolve, reject) => {
        file.load_contents_async(null, (_, res) => {
            try {
                const [success, bytes] = file.load_contents_finish(res);
                return success
                    ? resolve(new TextDecoder().decode(bytes))
                    : reject(new Error(
                        `reading file ${path} was unsuccessful`));
            } catch (error) {
                reject(error);
            }
        });
    });
}

export function writeFile(string: string, path: string): Promise<Gio.File> {
    const file = Gio.File.new_for_path(path);

    return new Promise((resolve, reject) => {
        file.replace_contents_bytes_async(
            new GLib.Bytes(new TextEncoder().encode(string)),
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null,
            (_, res) => {
                try {
                    file.replace_contents_finish(res);
                    resolve(file);
                } catch (error) {
                    reject(error);
                }
            },
        );
    });
}

export function bulkConnect(
    service: GObject.Object,
    list: [
        event: string,
        callback: (...args: any[]) => void
    ][],
) {
    const ids = [];
    for (const [event, callback] of list)
        ids.push(service.connect(event, callback));

    return ids;
}

export function bulkDisconnect(service: GObject.Object, ids: number[]) {
    for (const id of ids)
        service.disconnect(id);
}

export function connect(
    service: GObject.Object,
    widget: Gtk.Widget,
    callback: (widget: Gtk.Widget, ...args: any[]) => void,
    event = 'changed',
) {
    const bind = service.connect(
        event, (_s, ...args: any[]) => callback(widget, ...args));

    widget.connect('destroy', () => service.disconnect(bind));
    timeout(10, () => callback(widget));
}

export function interval(
    interval: number,
    callback: () => void, widget: Gtk.Widget,
) {
    callback();
    const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
        callback();
        return true;
    });
    if (widget) {
        widget.connect('destroy', () => GLib.source_remove(id));
        return widget;
    }
    return id;
}

export function timeout(ms: number, callback: () => void) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        callback();
        return GLib.SOURCE_REMOVE;
    });
}

export function runCmd(
    cmd: Command,
    ...args: any[]
) {
    if (typeof cmd !== 'string' && typeof cmd !== 'function') {
        console.error('Command has to be string or function');
        return false;
    }

    if (!cmd)
        return false;

    if (typeof cmd === 'string') {
        GLib.spawn_command_line_async(cmd);
        return true;
    }

    if (typeof cmd === 'function')
        return cmd(...args);

    return false;
}

export function lookUpIcon(name?: string, size = 16) {
    if (!name)
        return null;

    return Gtk.IconTheme.get_default().lookup_icon(
        name,
        size,
        Gtk.IconLookupFlags.USE_BUILTIN,
    );
}

export function ensureDirectory(path?: string) {
    if (path && !GLib.file_test(path, GLib.FileTest.EXISTS))
        Gio.File.new_for_path(path).make_directory_with_parents(null);
}

export function execAsync(cmd: string | string[]): Promise<string> {
    const proc = Gio.Subprocess.new(
        typeof cmd === 'string' ? cmd.split(' ') : cmd,
        Gio.SubprocessFlags.STDOUT_PIPE |
        Gio.SubprocessFlags.STDERR_PIPE,
    );

    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                if (!proc)
                    return reject(null);

                const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                proc.get_successful()
                    ? resolve(stdout.trim())
                    : reject(stderr.trim());
            } catch (e) {
                reject(e);
            }
        });
    });
}

export function exec(cmd: string) {
    const [success, out, err] =
        GLib.spawn_command_line_sync(cmd);

    const decoder = new TextDecoder();
    if (!success)
        return decoder.decode(err).trim();

    return decoder.decode(out).trim();
}

export function subprocess(
    cmd: string | string[],
    callback: (out: string) => void,
    onError = logError,
) {
    try {
        const read = (stdout: Gio.DataInputStream) => {
            stdout.read_line_async(GLib.PRIORITY_LOW, null, (stdout, res) => {
                try {
                    const output = stdout?.read_line_finish_utf8(res)[0];
                    if (output) {
                        callback(output);
                        read(stdout);
                    }
                } catch (e) {
                    return onError(e as Error);
                }
            });
        };

        const proc = Gio.Subprocess.new(
            typeof cmd === 'string' ? cmd.split(' ') : cmd,
            Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_PIPE,
        );

        const pipe = proc.get_stdout_pipe();
        if (!pipe) {
            onError(new Error(`subprocess ${cmd} stdout pipe is null`));
            return null;
        }

        const stdout = new Gio.DataInputStream({
            base_stream: pipe,
            close_base_stream: true,
        });

        read(stdout);
        return proc;
    } catch (e) {
        onError(e as Error);
        return null;
    }
}
