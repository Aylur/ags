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
        : log(`ERROR: ${message}`);

    if (getConfig()?.exitOnError)
        App.quit();
}

export function warning(message: string) {
    getConfig()?.stackTraceOnError
        ? logError(new Error(message))
        : log(`WARNING: ${message}`);
}

export function typecheck(key: string, value: unknown, type: string|string[], widget: string ) {
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

    file.replace_contents_bytes_async(
        new GLib.Bytes(new TextEncoder().encode(string)),
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null,
        (_file, result) => {
            try {
                file.replace_contents_finish(result);
            } catch (e) {
                logError(e as Error);
            }
        },
    );
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

export function runCmd(cmd: string|((widget?: Gtk.Widget) => void), widget?: Gtk.Widget) {
    if (!cmd)
        return;

    if (typeof cmd === 'string')
        return execAsync(cmd);

    if (typeof cmd === 'function')
        return cmd(widget);
}

export function getConfig(): Config|null {
    try {
        imports.searchPath.push(CONFIG_DIR);
        return imports.config.config as Config;
    } catch (error) {
        logError(error as Error);
        return null;
    }
}

export function lookUpIcon(name: string|null, size = 16): Gtk.IconInfo|null {
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

export function isRunning(dbusName: string): boolean {
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

/**
 * the execution works, but the promise
 * wont resolve for some reason and awaiting it just blocks forever
 */
type execCallback = (out: string, proc: Gio.Subprocess) => void;
export async function execAsync(cmd: string|string[], onSuccess?: execCallback, onFail?: execCallback) {
    if (typeof cmd === 'string')
        cmd = cmd.split(' ');

    const proc = Gio.Subprocess.new(
        cmd,
        Gio.SubprocessFlags.STDOUT_PIPE |
        Gio.SubprocessFlags.STDERR_PIPE,
    );

    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                if (!proc)
                    return reject(null);

                const [, stdout, stderr] = proc.communicate_utf8_finish(res);

                if (proc.get_successful()) {
                    resolve([stdout, proc]);
                    if (onSuccess)
                        onSuccess(stdout, proc);
                }
                else {
                    reject([stderr, proc]);
                    if (onFail)
                        onFail(stderr, proc);
                }
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
        return decoder.decode(err);

    return decoder.decode(out);
}
