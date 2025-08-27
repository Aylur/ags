import { Service, iface, methodAsync } from "gnim/dbus"

export interface AppDBusImpl {
    insector(): void
    toggleWindow(name: string): void
    quit(): void
    request(argv: string[]): Promise<string>
}

@iface("io.Astal.Application")
export class AppDBus extends Service {
    private impl: AppDBusImpl

    @methodAsync()
    async Inspector(): Promise<void> {
        return Promise.resolve(this.impl.insector())
    }

    @methodAsync("s")
    async ToggleWindow(name: string): Promise<void> {
        return Promise.resolve(this.impl.toggleWindow(name))
    }

    @methodAsync()
    async Quit(): Promise<void> {
        return Promise.resolve(this.impl.quit())
    }

    @methodAsync(["as"], ["s"])
    async Request(argv: string[]): Promise<[string]> {
        return this.impl.request(argv).then((res) => [res])
    }

    constructor(impl: AppDBusImpl) {
        super()
        this.impl = impl
    }

    static proxy(instanceName: string) {
        const app = new AppDBus({
            insector() {},
            toggleWindow() {},
            quit() {},
            request() {
                return Promise.reject()
            },
        })

        return app.proxy({
            name: "io.Astal." + instanceName,
        })
    }
}
