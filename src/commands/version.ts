import Astal from "gi://Astal";
import { exit } from "system";
import { stdout } from "@/lib/console";
import { fg } from "@/lib/colors";

async function lib(lib: string) {
    try {
        const mod = await import(`gi://Astal${lib}`)
        return mod.default.VERSION
    } catch (error) {
        return "not installed"
    }
}

function ver(name: string, ver: string) {
    stdout.puts(`${name}: ${fg.yellow(ver)}\n`)
}

export default async function version() {
    ver("ags", VERSION)
    ver("astal", Astal.VERSION)
    ver("apps", await lib("Apps"))
    ver("auth", await lib("Auth"))
    ver("battery", await lib("Battery"))
    ver("bluetooth", await lib("Bluetooth"))
    ver("hyprland", await lib("Hyprland"))
    ver("mpris", await lib("Mpris"))
    ver("notifd", await lib("Notifd"))
    ver("powerprofiles", await lib("PowerProfiles"))
    ver("river", await lib("River"))
    ver("tray", await lib("Tray"))
    ver("wp", await lib("Wp"))
    exit(0)
}
