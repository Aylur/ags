/**
 * Workaround for "Can't convert non-null pointer to JS value "
 */

export {}

function snakeify(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replaceAll("-", "_")
        .toLowerCase()
}

async function suppress<T>(mod: Promise<{ default: T }>, patch: (m: T) => void) {
    return mod.then((m) => patch(m.default)).catch(() => void 0)
}

function patch<P extends object>(proto: P, prop: Extract<keyof P, string>) {
    Object.defineProperty(proto, prop, {
        get() {
            return this[`get_${snakeify(prop)}`]()
        },
    })
}

await suppress(import("gi://AstalApps"), ({ Apps, Application }) => {
    patch(Apps.prototype, "list")
    patch(Application.prototype, "keywords")
    patch(Application.prototype, "categories")
})

await suppress(import("gi://AstalBattery"), ({ UPower }) => {
    patch(UPower.prototype, "devices")
})

await suppress(import("gi://AstalBluetooth"), ({ Adapter, Bluetooth, Device }) => {
    patch(Adapter.prototype, "uuids")
    patch(Bluetooth.prototype, "adapters")
    patch(Bluetooth.prototype, "devices")
    patch(Device.prototype, "uuids")
})

await suppress(import("gi://AstalHyprland"), ({ Hyprland, Monitor, Workspace }) => {
    patch(Hyprland.prototype, "binds")
    patch(Hyprland.prototype, "monitors")
    patch(Hyprland.prototype, "workspaces")
    patch(Hyprland.prototype, "clients")
    patch(Monitor.prototype, "availableModes")
    patch(Monitor.prototype, "available_modes")
    patch(Workspace.prototype, "clients")
})

await suppress(import("gi://AstalMpris"), ({ Mpris, Player }) => {
    patch(Mpris.prototype, "players")
    patch(Player.prototype, "supported_uri_schemes")
    patch(Player.prototype, "supportedUriSchemes")
    patch(Player.prototype, "supported_mime_types")
    patch(Player.prototype, "supportedMimeTypes")
    patch(Player.prototype, "comments")
})

await suppress(import("gi://AstalNetwork"), ({ Wifi }) => {
    patch(Wifi.prototype, "access_points")
    patch(Wifi.prototype, "accessPoints")
})

await suppress(import("gi://AstalNotifd"), ({ Notifd, Notification }) => {
    patch(Notifd.prototype, "notifications")
    patch(Notification.prototype, "actions")
})

await suppress(import("gi://AstalPowerProfiles"), ({ PowerProfiles }) => {
    patch(PowerProfiles.prototype, "actions")
})

await suppress(import("gi://AstalWp"), ({ Wp, Audio, Video }) => {
    patch(Wp.prototype, "endpoints")
    patch(Wp.prototype, "devices")
    patch(Audio.prototype, "streams")
    patch(Audio.prototype, "recorders")
    patch(Audio.prototype, "microphones")
    patch(Audio.prototype, "speakers")
    patch(Audio.prototype, "devices")
    patch(Video.prototype, "streams")
    patch(Video.prototype, "recorders")
    patch(Video.prototype, "sinks")
    patch(Video.prototype, "sources")
    patch(Video.prototype, "devices")
})

await suppress(import("gi://AstalTray"), ({ Tray }) => {
    patch(Tray.prototype, "items")
})
