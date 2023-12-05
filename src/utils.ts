import Gtk from 'gi://Gtk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

export const USER = GLib.get_user_name();
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/${pkg.name.split('.').pop()}`;

export function readFile(file: string | Gio.File) {
    try {
        const f = typeof file === 'string'
            ? Gio.File.new_for_path(file)
            : file;

        const [, bytes] = f.load_contents(null);
        return new TextDecoder().decode(bytes);
    } catch (_) {
        return '';
    }
}

export function readFileAsync(file: string | Gio.File): Promise<string> {
    const f = typeof file === 'string'
        ? Gio.File.new_for_path(file)
        : file;

    return new Promise((resolve, reject) => {
        f.load_contents_async(null, (_, res) => {
            try {
                const [success, bytes] = f.load_contents_finish(res);
                if (success) {
                    resolve(new TextDecoder().decode(bytes));
                }
                else {
                    const path = typeof file === 'string' ? file : file.get_path();
                    reject(Error(`reading file ${path} was unsuccessful`));
                }
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

const fileMonitors: Map<Gio.FileMonitor, boolean> = new Map;
export function monitorFile(
    path: string,
    callback?: (file: Gio.File, event: Gio.FileMonitorEvent) => void,
    type: 'file' | 'directory' = 'file',
    flags = Gio.FileMonitorFlags.NONE,
) {
    try {
        const file = Gio.File.new_for_path(path);
        const mon = type === 'directory'
            ? file.monitor_directory(flags, null)
            : file.monitor_file(flags, null);

        if (callback)
            mon.connect('changed', (_, file, _f, event) => callback(file, event));

        // we need to save a reference in case the user doesn't
        // otherwise GC will pick it up
        fileMonitors.set(mon, true);
        mon.connect('notify::cancelled', () => {
            fileMonitors.delete(mon);
        });

        return mon;
    } catch (error) {
        logError(error);
        return null;
    }
}

export function loadInterfaceXML(iface: string) {
    const uri = `resource:///com/github/Aylur/ags/dbus/${iface}.xml`;
    const f = Gio.File.new_for_uri(uri);

    try {
        const [, bytes] = f.load_contents(null);
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error(e as Error);
        return null;
    }
}


export function bulkConnect(
    service: GObject.Object,
    list: [
        event: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function interval(
    interval: number,
    callback: () => void,
    bind?: Gtk.Widget,
) {
    callback();
    const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
        callback();
        return true;
    });
    if (bind)
        bind.connect('destroy', () => GLib.source_remove(id));

    return id;
}

export function timeout(ms: number, callback: () => void) {
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        callback();
        return GLib.SOURCE_REMOVE;
    });
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
        typeof cmd === 'string' ? cmd.split(/\s+/) : cmd,
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
                    ? resolve(stdout!.trim())
                    : reject(stderr!.trim());
            } catch (e) {
                reject(e);
            }
        });
    });
}

export function exec(cmd: string) {
    const [success, out, err] = GLib.spawn_command_line_sync(cmd);

    const decoder = new TextDecoder();
    if (!success)
        return decoder.decode(err).trim();

    return decoder.decode(out).trim();
}

export function subprocess(
    cmd: string | string[],
    callback: (out: string) => void,
    onError = logError,
    bind?: Gtk.Widget,
) {
    try {
        const read = (stdout: Gio.DataInputStream) => {
            stdout.read_line_async(GLib.PRIORITY_LOW, null, (stdout, res) => {
                try {
                    const output = stdout?.read_line_finish_utf8(res)[0];
                    if (typeof output === 'string' && stdout) {
                        callback(output);
                        read(stdout);
                    }
                } catch (e) {
                    onError(e as Error);
                }
            });
        };

        const proc = Gio.Subprocess.new(
            typeof cmd === 'string' ? cmd.split(/\s+/) : cmd,
            Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_PIPE,
        );

        const pipe = proc.get_stdout_pipe();
        if (!pipe) {
            onError(Error(`subprocess ${cmd} stdout pipe is null`));
            return null;
        }

        const stdout = new Gio.DataInputStream({
            base_stream: pipe,
            close_base_stream: true,
        });

        read(stdout);

        if (bind)
            bind.connect('destroy', () => proc.force_exit());

        return proc;
    } catch (e) {
        onError(e as Error);
        return null;
    }
}

export function getGObjectProperties(obj: GObject.Object) {
    const result = {};
    //@ts-ignore
    const props = obj.constructor.list_properties() as GObject.ParamSpec[];
    props.forEach(p => {
        try {
            //@ts-expect-error
            result[p.name] = this[p.name];
        }
        catch (e) {
            //this is here to ignore this error, might happen with other properties as well.
            //Error: Can't get field "parent";
            //GObject introspection supports only fields with simple types, not interface
        }
    });
    return result;
}
