import Gtk from 'gi://Gtk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export function execAsync(cmd: string | string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof cmd === 'string') {
            try {
                const [, argv] = GLib.shell_parse_argv(cmd);
                cmd = argv;
            } catch (error) {
                return reject(error);
            }
        }

        const proc = Gio.Subprocess.new(
            cmd,
            Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_PIPE,
        );

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
                    onError(e);
                }
            });
        };

        if (typeof cmd === 'string') {
            try {
                const [, argv] = GLib.shell_parse_argv(cmd);
                cmd = argv;
            } catch (error) {
                onError(error);
                return null;
            }
        }

        const proc = Gio.Subprocess.new(
            cmd,
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
        logError(e);
        return null;
    }
}
