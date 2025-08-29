import Gio from "gi://Gio?version=2.0"
import { Service, iface, methodAsync } from "gnim/dbus"
import { AppDBus } from "./dbus.js"

@iface("org.freedesktop.DBus")
class DBus extends Service {
    @methodAsync([], ["as"]) ListNames(): Promise<[string[]]> {
        return Promise.reject()
    }
}

export async function getInstanceNames() {
    const bus = await new DBus().proxy()
    const [names] = await bus.ListNames()
    bus.stop()
    return names
        .filter((name) => name.startsWith("io.Astal."))
        .map((name) => name.replace("io.Astal.", ""))
}

export async function quitInstance(instanceName: string) {
    const app = await AppDBus.proxy(instanceName)
    try {
        await app.Quit()
    } catch (error) {
        if (error instanceof Gio.DBusError && error.code === Gio.DBusError.NO_REPLY) {
            // NoReply is expected since it exits
        } else {
            throw error
        }
    } finally {
        app.stop()
    }
}

export async function openInspector(instanceName: string) {
    const app = await AppDBus.proxy(instanceName)
    await app.Inspector()
    app.stop()
}

export async function toggleWindow(instanceName: string, windowName: string) {
    const app = await AppDBus.proxy(instanceName)
    await app.ToggleWindow(windowName)
    app.stop()
}

export async function sendRequest(instanceName: string, ...argv: string[]) {
    const app = await AppDBus.proxy(instanceName)
    const [res] = await app.Request(argv)
    app.stop()
    return res
}
