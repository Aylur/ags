import "./overrides.js"
import { setConsoleLogDomain } from "console"
import { exit, programArgs } from "system"
import { createRoot } from "../gnim/src/jsx/scope.js"
import IO from "gi://AstalIO"
import GObject from "gi://GObject"
import Gio from "gi://Gio?version=2.0"
import type Astal3 from "gi://Astal?version=3.0"
import type Astal4 from "gi://Astal?version=4.0"

type Config = Partial<{
    instanceName: string
    css: string
    icons: string
    gtkTheme: string
    iconTheme: string
    cursorTheme: string
    hold: boolean
    requestHandler(request: string, res: (response: any) => void): void
    main(...args: string[]): void
    client(message: (msg: string) => string, ...args: string[]): void
}>

interface Astal3JS extends Astal3.Application {
    eval(body: string): Promise<any>
    requestHandler: Config["requestHandler"]
    apply_css(style: string, reset?: boolean): void
    quit(code?: number): void
    start(config?: Config): void
}

interface Astal4JS extends Astal4.Application {
    eval(body: string): Promise<any>
    requestHandler?: Config["requestHandler"]
    apply_css(style: string, reset?: boolean): void
    quit(code?: number): void
    start(config?: Config): void
}

type App3 = typeof Astal3.Application
type App4 = typeof Astal4.Application

export function mkApp<App extends App3>(App: App): Astal3JS
export function mkApp<App extends App4>(App: App): Astal4JS

export function mkApp(App: App3 | App4) {
    return new (class AstalJS extends App {
        private disposeRoot?: () => void

        static {
            GObject.registerClass({ GTypeName: "AstalJS" }, this as any)
        }

        eval(body: string): Promise<any> {
            return new Promise((res, rej) => {
                try {
                    const fn = Function(`return (async function() {
                        ${body.includes(";") ? body : `return ${body};`}
                    })`)
                    fn()().then(res).catch(rej)
                } catch (error) {
                    rej(error)
                }
            })
        }

        requestHandler?: Config["requestHandler"]

        vfunc_shutdown(): void {
            super.vfunc_shutdown()
            this.disposeRoot?.()
        }

        vfunc_request(msg: string, conn: Gio.SocketConnection): void {
            if (typeof this.requestHandler === "function") {
                this.requestHandler(msg, (response) => {
                    IO.write_sock(conn, String(response), (_, res) => IO.write_sock_finish(res))
                })
            } else {
                super.vfunc_request(msg, conn)
            }
        }

        apply_css(style: string, reset = false) {
            super.apply_css(style, reset)
        }

        quit(code?: number): void {
            super.quit()
            exit(code ?? 0)
        }

        start({ requestHandler, css, hold, main, client, icons, ...cfg }: Config = {}) {
            const app = this as unknown as InstanceType<App3 | App4>

            client ??= () => {
                print(`Astal instance "${app.instanceName}" already running`)
                exit(1)
            }

            Object.assign(this, cfg)
            setConsoleLogDomain(app.instanceName)

            this.requestHandler = requestHandler
            app.connect("activate", () => {
                createRoot((dispose) => {
                    this.disposeRoot = dispose
                    main?.(...programArgs)
                })
            })

            try {
                app.acquire_socket()
            } catch {
                return client((msg) => IO.send_request(app.instanceName, msg)!, ...programArgs)
            }

            if (css) this.apply_css(css, false)

            if (icons) app.add_icons(icons)

            hold ??= true
            if (hold) app.hold()

            app.runAsync([])
        }
    })()
}
