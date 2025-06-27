import AstalIO from "gi://AstalIO"
import { Accessor } from "../gnim/src/jsx/index.js"
import { execAsync } from "./process.js"

export type Time = AstalIO.Time
export const Time = AstalIO.Time

export function interval(interval: number, callback?: () => void) {
    return AstalIO.Time.interval(interval, () => void callback?.())
}

export function timeout(timeout: number, callback?: () => void) {
    return AstalIO.Time.timeout(timeout, () => void callback?.())
}

export function idle(callback?: () => void) {
    return AstalIO.Time.idle(() => void callback?.())
}

export function createPoll(
    init: string,
    interval: number,
    exec: string | string[],
): Accessor<string>

export function createPoll<T>(
    init: T,
    interval: number,
    exec: string | string[],
    transform: (stdout: string, prev: T) => T,
): Accessor<T>

export function createPoll<T>(
    init: T,
    interval: number,
    fn: (prev: T) => T | Promise<T>,
): Accessor<T>

export function createPoll<T>(
    init: T,
    ival: number,
    execOrFn: string | string[] | ((prev: T) => T | Promise<T>),
    transform?: (stdout: string, prev: T) => T,
): Accessor<T> {
    let currentValue = init
    let timer: AstalIO.Time | null = null
    const subscribers = new Set<() => void>()

    function subscribe(callback: () => void): () => void {
        function set(value: T) {
            if (value !== currentValue) {
                currentValue = value
                subscribers.forEach((cb) => cb())
            }
        }

        if (subscribers.size === 0) {
            timer = interval(ival, () => {
                if (typeof execOrFn === "function") {
                    const value = execOrFn(currentValue)
                    if (value instanceof Promise) {
                        value.then(set)
                    } else {
                        set(value)
                    }
                } else {
                    execAsync(execOrFn).then((stdout) => {
                        set(transform ? transform(stdout, currentValue) : (stdout as T))
                    })
                }
            })
        }

        subscribers.add(callback)

        return () => {
            subscribers.delete(callback)
            if (subscribers.size === 0) {
                timer?.cancel()
                timer = null
            }
        }
    }

    return new Accessor(() => currentValue, subscribe)
}
