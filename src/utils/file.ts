import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

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

export function writeFileSync(string: string, path: string) {
    const file = Gio.File.new_for_path(path);
    return file.replace_contents(
        new TextEncoder().encode(string),
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null);
}

const fileMonitors: Map<Gio.FileMonitor, boolean> = new Map;
export function monitorFile(
    path: string,
    callback?: (file: Gio.File, event: Gio.FileMonitorEvent) => void,
    flags = Gio.FileMonitorFlags.NONE,
) {
    // FIXME: remove the checking in the next release
    // @ts-expect-error
    if (flags === 'file' || flags === 'directory') {
        throw Error(
            `${flags}` + ' passed as a parameter in `monitorFile`. ' +
            'Specifying the type is no longer required.',
        );
    }

    try {
        const file = Gio.File.new_for_path(path);
        const mon = file.monitor(flags, null);

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
