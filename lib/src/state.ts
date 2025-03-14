import { State } from "../gjsx/src/state.js"
import * as process from "./process.js"
import * as time from "./time.js"

export * from "../gjsx/src/state.js"

type Transform<T> = (stdout: string, prev: T) => T
type ErrHandler<T> = (stderr: string, prevt: T) => void
type Exec = string | string[]
type Callback<T> = (prev: T) => T | Promise<T>

export class Poll<T> extends State<T> {
    private time?: time.Time

    isPolling() { return !!this.time }

    constructor(
        init: T,
        interval: number,
        exec: Exec,
        transform?: Transform<T>,
        onError?: ErrHandler<T>,
    )

    constructor(
        init: T,
        interval: number,
        callback: Callback<T>,
        onError?: ErrHandler<T>,
    )

    constructor(
        init: T,
        interval: number,
        execOrCallback: Exec | Callback<T>,
        transformOrErrHandler?: Transform<T> | ErrHandler<T>,
        onError?: ErrHandler<T>,
    ) {
        super(init)
        if (typeof execOrCallback === "function") {
            this.pollFn(
                interval,
                execOrCallback,
                transformOrErrHandler as ErrHandler<T>,
            )
        } else {
            this.pollExec(
                interval,
                execOrCallback,
                transformOrErrHandler as Transform<T>,
                onError,
            )
        }
    }

    stop() {
        this.time?.cancel()
        delete this.time
    }

    pollExec(
        interval: number,
        exec: Exec,
        transform: Transform<T> = out => out as T,
        onError: ErrHandler<T> = err => console.error(err),
    ): void {
        this.stop()
        this.time = time.interval(interval, async () => {
            try {
                const v = await process.execAsync(exec)
                this.set(transform(v, this.get()))
            } catch (err) {
                onError(err as string, this.get())
            }
        })
    }

    pollFn(
        interval: number,
        callback: Callback<T>,
        onError: ErrHandler<T> = err => console.error(err),
    ): void {
        this.stop()
        this.time = time.interval(interval, async () => {
            const v = callback(this.get())
            if (v instanceof Promise) {
                try {
                    this.set(await v)
                } catch (err) {
                    onError(err as string, this.get())
                }
            } else {
                this.set(v)
            }
        })
    }

    toString(): string {
        return `Poll<${typeof this.get()}>`
    }

    destroy() {
        this.stop()
        super.destroy()
    }
}

export class Watch<T> extends State<T> {
    private proc?: process.Process

    constructor(
        init: T,
        exec: Exec,
        transform?: Transform<T>,
        onError?: ErrHandler<T>,
    ) {
        super(init)
        this.watch(exec, transform, onError)
    }

    watch(
        exec: Exec,
        transform: Transform<T> = out => out as T,
        onError: ErrHandler<T> = err => console.error(err),
    ) {
        this.stop()
        this.proc = process.subprocess({
            cmd: exec,
            out: out => this.set(transform(out, this.get())),
            err: err => onError(err, this.get()),
        })
    }

    stop() {
        this.proc?.kill()
        delete this.proc
    }

    toString(): string {
        return `Watch<${typeof this.get()}>`
    }

    destroy() {
        this.stop()
        super.destroy()
    }
}
