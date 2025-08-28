import GObject, { register, signal } from "gnim/gobject"
import { Accessor } from "gnim"
import { execAsync } from "./process.js"
import GLib from "gi://GLib?version=2.0"

export namespace Timer {
    export interface SignalSignatures extends GObject.Object.SignalSignatures {
        now(): void
        cancelled(): void
    }
}

@register()
export class Timer extends GObject.Object {
    declare $signals: Timer.SignalSignatures

    @signal()
    protected now() {}

    @signal()
    protected cancelled() {}

    static interval(interval: number, callback?: () => void) {
        const { timer, now } = Timer.new(callback, () => {
            if (immediate.is_destroyed()) immediate.destroy()
            if (source.is_destroyed()) source.destroy()
        })
        const immediate = setTimeout(now)
        const source = setInterval(now, interval)
        return timer
    }

    static timeout(interval: number, callback?: () => void) {
        const { timer, now } = Timer.new(callback, () => {
            if (source.is_destroyed()) source.destroy()
        })
        const source = setTimeout(now, interval)
        return timer
    }

    static idle(callback?: () => void) {
        const { timer, now } = Timer.new(callback, () => {
            if (source.is_destroyed()) source.destroy()
        })
        const source = setTimeout(now)
        return timer
    }

    private static new(onNow?: () => void, onCancelled?: () => void) {
        const timer = new Timer()
        const now = timer.connect("now", () => void onNow?.())
        const cancelled = timer.connect("cancelled", () => {
            timer.disconnect(now)
            timer.disconnect(cancelled)
            onCancelled?.()
        })
        return { timer, now: () => timer.now() }
    }

    connect<S extends keyof Timer.SignalSignatures>(
        signal: S,
        callback: GObject.SignalCallback<this, Timer.SignalSignatures[S]>,
    ): number {
        return super.connect(signal, callback)
    }

    cancel() {
        this.cancelled()
    }
}

export const { interval, timeout, idle } = Timer

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
    let timer: GLib.Source | null = null
    const subscribers = new Set<() => void>()

    function set(value: T) {
        if (value !== currentValue) {
            currentValue = value
            Array.from(subscribers).forEach((cb) => cb())
        }
    }

    function compute() {
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
    }

    function subscribe(callback: () => void): () => void {
        if (subscribers.size === 0) {
            setTimeout(compute)
            timer = setInterval(compute, ival)
        }

        subscribers.add(callback)

        return () => {
            subscribers.delete(callback)
            if (subscribers.size === 0 && timer) {
                clearInterval(timer)
                timer = null
            }
        }
    }

    return new Accessor(() => currentValue, subscribe)
}
