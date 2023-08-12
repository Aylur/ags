import Gtk from 'gi://Gtk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import App from './app.js';
import { type Window } from './window.js';

interface Config {
    windows?: Window[]
    style?: string
    stackTraceOnError?: boolean
    baseIconSize?: number
    notificationPopupTimeout?: number
    exitOnError?: boolean
    closeWindowDelay: { [key: string]: number }
}

export const USER = GLib.get_user_name();
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/${pkg.name}`;
export const MEDIA_CACHE_PATH = `${CACHE_DIR}/media`;
export const NOTIFICATIONS_CACHE_PATH = `${CACHE_DIR}/notifications`;
export const CONFIG_DIR = `${GLib.get_user_config_dir()}/${pkg.name}`;

export function error(message: string) {
    getConfig()?.stackTraceOnError
        ? logError(new Error(message))
        : print(`AGS ERROR: ${message}`);

    if (getConfig()?.exitOnError)
        App.quit();
}

export function warning(message: string) {
    getConfig()?.stackTraceOnError
        ? logError(new Error(message))
        : print(`AGS WARNING: ${message}`);
}

export function typecheck(key: string, value: unknown, type: string | string[], widget: string) {
    if (Array.isArray(type)) {
        for (const t of type) {
            if (t === 'array' && Array.isArray(value))
                return true;

            if (typeof value === t)
                return true;
        }

        warning(`"${key}" has to be one of ${type.join(' or ')} on ${widget}`);
        return false;
    }

    if (type === 'array' && Array.isArray(value))
        return true;

    if (typeof value === type)
        return true;

    warning(`"${key}" has to be a ${type} on ${widget} but it is of type ${typeof value}`);
    return false;
}

export function restcheck(rest: object, widget: string) {
    const keys = Object.keys(rest);
    if (keys.length === 0)
        return;

    warning(`unknown keys on ${widget}: ${JSON.stringify(keys)}`);
}

export function readFile(path: string) {
    try {
        const f = Gio.File.new_for_path(path);
        const [, bytes] = f.load_contents(null);
        return new TextDecoder().decode(bytes);
    } catch (_) {
        return null;
    }
}

export function writeFile(string: string, path: string) {
    const file = Gio.File.new_for_path(path);

    return new Promise((resolve, reject) => {
        file.replace_contents_bytes_async(
            new GLib.Bytes(new TextEncoder().encode(string)),
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null,
            (_file, result) => {
                try {
                    file.replace_contents_finish(result);
                    resolve(file);
                } catch (e) {
                    reject(e);
                }
            },
        );
    });
}

export function bulkConnect(service: GObject.Object, list: [event: string, callback: (...args: any[]) => void][]) {
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
    const bind = service.connect(event, (_s: GObject.Object, ...args: any[]) => callback(widget, ...args));
    widget.connect('destroy', () => service.disconnect(bind));
    timeout(10, () => callback(widget));
}

export function interval(interval: number, callback: () => void, widget: Gtk.Widget) {
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

export function runCmd(cmd: string | ((...args: any[]) => void), ...args: any[]) {
    if (!cmd)
        return;

    if (typeof cmd === 'string')
        return GLib.spawn_command_line_async(cmd);

    if (typeof cmd === 'function')
        return cmd(...args);
}

export function getConfig() {
    try {
        imports.searchPath.push(CONFIG_DIR);
        return imports.config.config as Config;
    } catch (err) {
        GLib.file_test(CONFIG_DIR + '/config.js', GLib.FileTest.EXISTS)
            ? logError(err as Error)
            : print('No config was provided');

        return null;
    }
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

export const help = (bin: string) => `USAGE:
    ${bin} [COMMAND] <ARGUMENTS>

COMMANDS:
    help\t\tPrint this help
    version\t\tPrint version
    clear-cache\t\tRemoves ${CACHE_DIR}
    toggle-window name\tToggle window
    run-js string\tRuns string as a js function
    inspector\t\tOpen debugger`;

export function ensureDirectory(path?: string) {
    if (path && !GLib.file_test(path, GLib.FileTest.EXISTS)) {
        Gio.File.new_for_path(path).make_directory_with_parents(null);
    }
    else {
        [
            MEDIA_CACHE_PATH,
            NOTIFICATIONS_CACHE_PATH,
        ]
            .forEach(path => {
                if (!GLib.file_test(path, GLib.FileTest.EXISTS))
                    Gio.File.new_for_path(path).make_directory_with_parents(null);
            });
    }
}

export function isRunning(dbusName: string) {
    return Gio.DBus.session.call_sync(
        'org.freedesktop.DBus',
        '/org/freedesktop/DBus',
        'org.freedesktop.DBus',
        'NameHasOwner',
        // @ts-ignore
        GLib.Variant.new_tuple([new GLib.Variant('s', dbusName)]),
        new GLib.VariantType('(b)'),
        Gio.DBusCallFlags.NONE,
        -1,
        null,
    ).deepUnpack()?.toString() === 'true' || false;
}

export function execAsync(cmd: string | string[]) {
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
        if (!pipe)
            return onError(new Error(`subprocess ${cmd} stdout pipe is null`));

        const stdout = new Gio.DataInputStream({
            base_stream: pipe,
            close_base_stream: true,
        });

        read(stdout);
    } catch (e) {
        return onError(e as Error);
    }
}
