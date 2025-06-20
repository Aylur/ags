import AstalIO from "gi://AstalIO"
import { Accessor } from "../gnim/src/jsx/index.js"

type Args = {
    cmd: string | string[]
    out?: (stdout: string) => void
    err?: (stderr: string) => void
}

export type Process = AstalIO.Process
export const Process = AstalIO.Process

export function subprocess(args: Args): AstalIO.Process

export function subprocess(
    cmd: string | string[],
    onOut?: (stdout: string) => void,
    onErr?: (stderr: string) => void,
): AstalIO.Process

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

    const proc = Array.isArray(cmd)
        ? AstalIO.Process.subprocessv(cmd)
        : AstalIO.Process.subprocess(cmd)

    proc.connect("stdout", (_, stdout: string) => out(stdout))
    proc.connect("stderr", (_, stderr: string) => err(stderr))
    return proc
}

/** @throws {GLib.Error} Throws stderr */
export function exec(cmd: string | string[]) {
    return Array.isArray(cmd) ? AstalIO.Process.execv(cmd) : AstalIO.Process.exec(cmd)
}

export function execAsync(cmd: string | string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        if (Array.isArray(cmd)) {
            AstalIO.Process.exec_asyncv(cmd, (_, res) => {
                try {
                    resolve(AstalIO.Process.exec_asyncv_finish(res))
                } catch (error) {
                    reject(error)
                }
            })
        } else {
            AstalIO.Process.exec_async(cmd, (_, res) => {
                try {
                    resolve(AstalIO.Process.exec_finish(res))
                } catch (error) {
                    reject(error)
                }
            })
        }
    })
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
    let proc: AstalIO.Process | null = null
    const subscribers = new Set<() => void>()

    function subscribe(callback: () => void): () => void {
        if (subscribers.size === 0) {
            proc = subprocess(exec, (stdout) => {
                const value = transform ? transform(stdout, currentValue) : (stdout as T)
                if (currentValue !== value) {
                    currentValue = value
                    subscribers.forEach((cb) => cb())
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
