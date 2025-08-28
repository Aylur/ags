import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"
import GObject, { register, signal } from "gnim/gobject"
import { Accessor } from "gnim"

export namespace Process {
    export interface SignalSignatures extends GObject.Object.SignalSignatures {
        stdout: Process["stdout"]
        stderr: Process["stderr"]
        exit: Process["exit"]
    }
    export interface ConstructorProps extends GObject.Object.ConstructorProps {
        argv: string[]
    }
}

@register()
export class Process extends GObject.Object {
    @signal(String)
    protected stdout(out: string) {
        void out
    }

    @signal(String)
    protected stderr(err: string) {
        void err
    }

    @signal(Number, Boolean)
    protected exit(code: number, signaled: boolean) {
        void [code, signaled]
    }

    #encoder = new TextEncoder()
    #outStream: Gio.DataInputStream
    #errStream: Gio.DataInputStream
    #inStream: Gio.DataOutputStream
    #process: Gio.Subprocess

    #readStream(stream: Gio.DataInputStream) {
        stream.read_line_async(GLib.PRIORITY_DEFAULT, null, (_, res) => {
            try {
                const [output] = stream.read_line_finish_utf8(res)
                if (output !== null) {
                    if (stream === this.#errStream) {
                        this.stderr(output.trim())
                    } else {
                        this.stdout(output.trim())
                    }
                    this.#readStream(stream)
                }
            } catch (error) {
                console.error(error)
            }
        })
    }

    connect<S extends keyof Process.SignalSignatures>(
        signal: S,
        callback: GObject.SignalCallback<this, Process.SignalSignatures[S]>,
    ): number {
        return super.connect(signal, callback)
    }

    /**
     * Force quit the subprocess.
     */
    kill(): void {
        this.#process.force_exit()
    }

    /**
     * Send a signal to the subprocess.
     *
     * @param signal Signal number to be sent
     */
    signal(signal: number): void {
        this.#process.send_signal(signal)
    }

    /**
     * Write a line to the subprocess' stdin synchronously.
     *
     * @param str String to be written to stdin
     */
    write(str: string): void {
        this.#inStream.put_string(str)
    }

    /**
     * Write a line to the subprocess' stdin asynchronously.
     *
     * @param str String to be written to stdin
     */
    async writeAsync(str: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.#inStream.write_all_async(
                this.#encoder.encode(str),
                GLib.PRIORITY_DEFAULT,
                null,
                (_, res) => {
                    try {
                        resolve(void this.#inStream.write_all_finish(res))
                    } catch (error) {
                        reject(error)
                    }
                },
            )
        })
    }

    constructor({ argv }: Process.ConstructorProps) {
        super()
        const process = (this.#process = Gio.Subprocess.new(
            argv,
            Gio.SubprocessFlags.STDIN_PIPE |
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE,
        ))

        this.#inStream = Gio.DataOutputStream.new(process.get_stdin_pipe()!)
        this.#outStream = Gio.DataInputStream.new(process.get_stdout_pipe()!)
        this.#errStream = Gio.DataInputStream.new(process.get_stderr_pipe()!)

        this.#readStream(this.#outStream)
        this.#readStream(this.#errStream)

        process.wait_async(null, (_, res) => {
            try {
                process.wait_finish(res)
            } catch {
                // ignore
            }

            if (process.get_if_exited()) {
                this.exit(process.get_exit_status(), false)
            }

            if (process.get_if_signaled()) {
                this.exit(process.get_term_sig(), true)
            }
        })
    }

    /**
     * Start a new subprocess with the given command.
     * The first element of the vector is executed with the remaining
     * elements as the argument list.
     */
    static subprocessv(cmd: string[]) {
        return new Process({ argv: cmd })
    }

    /**
     * Start a new subprocess with the given command
     * which is parsed using {@link GLib.shell_parse_argv}.
     */
    static subprocess(cmd: string) {
        const [, argv] = GLib.shell_parse_argv(cmd)
        return Process.subprocessv(argv!)
    }

    /**
     * Execute a command synchronously.
     * The first element of the vector is executed with the remaining
     * elements as the argument list.
     *
     * @throws stderr
     * @return stdout of the subprocess
     */
    static execv(cmd: string[]) {
        const process = Gio.Subprocess.new(
            cmd,
            Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE,
        )

        const [, out, err] = process.communicate_utf8(null, null)
        if (process.get_successful()) {
            return out.trim()
        } else {
            throw new Error(err)
        }
    }

    /**
     * Execute a command synchronously.
     * The command is parsed using {@link GLib.shell_parse_argv}.
     *
     * @throws stderr
     * @return stdout of the subprocess
     */
    static exec(cmd: string) {
        const [, argv] = GLib.shell_parse_argv(cmd)
        return Process.execv(argv!)
    }

    /**
     * Execute a command asynchronously.
     * The first element of the vector is executed with the remaining
     * elements as the argument list.
     *
     * @throws stderr
     * @return stdout of the subprocess
     */
    static execAsyncv(cmd: string[]): Promise<string> {
        const process = Gio.Subprocess.new(
            cmd,
            Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE,
        )

        return new Promise((resolve, reject) => {
            process.communicate_utf8_async(null, null, (_, res) => {
                try {
                    const [, out, err] = process.communicate_utf8_finish(res)
                    if (process.get_successful()) {
                        return resolve(out.trim())
                    } else {
                        reject(new Error(err.trim()))
                    }
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    /**
     * Execute a command asynchronously.
     * The command is parsed using {@link GLib.shell_parse_argv}.
     *
     * @throws stderr
     * @return stdout of the subprocess
     */
    static execAsync(cmd: string) {
        const [, argv] = GLib.shell_parse_argv(cmd)
        return Process.execAsyncv(argv!)
    }
}

type Args = {
    cmd: string | string[]
    out?: (stdout: string) => void
    err?: (stderr: string) => void
}

export function subprocess(args: Args): Process

export function subprocess(
    cmd: string | string[],
    onOut?: (stdout: string) => void,
    onErr?: (stderr: string) => void,
): Process

export function subprocess(
    argsOrCmd: Args | string | string[],
    onOut: (stdout: string) => void = print,
    onErr: (stderr: string) => void = printerr,
) {
    const args = Array.isArray(argsOrCmd) || typeof argsOrCmd === "string"
    const { cmd, err, out } = {
        cmd: args ? argsOrCmd : argsOrCmd.cmd,
        err: args ? onErr : argsOrCmd.err || onErr,
        out: args ? onOut : argsOrCmd.out || onOut,
    }

    const proc = Array.isArray(cmd) ? Process.subprocessv(cmd) : Process.subprocess(cmd)
    proc.connect("stdout", (_, stdout: string) => out(stdout))
    proc.connect("stderr", (_, stderr: string) => err(stderr))
    return proc
}

/** @throws {Error} Throws stderr */
export function exec(cmd: string | string[]) {
    return Array.isArray(cmd) ? Process.execv(cmd) : Process.exec(cmd)
}

export function execAsync(cmd: string | string[]): Promise<string> {
    if (Array.isArray(cmd)) {
        return Process.execAsyncv(cmd)
    } else {
        return Process.execAsync(cmd)
    }
}

export function createSubprocess(init: string, exec: string | string[]): Accessor<string>

export function createSubprocess<T>(
    init: T,
    exec: string | string[],
    transform: (stdout: string, prev: T) => T,
): Accessor<T>

export function createSubprocess<T>(
    init: T,
    exec: string | string[],
    transform?: (stdout: string, prev: T) => T,
): Accessor<T> {
    let currentValue = init
    let proc: Process | null = null
    const subscribers = new Set<() => void>()

    function subscribe(callback: () => void): () => void {
        if (subscribers.size === 0) {
            proc = subprocess(exec, (stdout) => {
                const value = transform ? transform(stdout, currentValue) : (stdout as T)
                if (currentValue !== value) {
                    currentValue = value
                    Array.from(subscribers).forEach((cb) => cb())
                }
            })
        }

        subscribers.add(callback)

        return () => {
            subscribers.delete(callback)
            if (subscribers.size === 0) {
                proc?.kill()
                proc = null
            }
        }
    }

    return new Accessor(() => currentValue, subscribe)
}
