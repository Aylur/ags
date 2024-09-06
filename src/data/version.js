function getver(lib = "") {
    try {
        return imports.gi[`Astal${lib}`].VERSION
    }
    catch (error) {
        return "not installed"
    }
}

function ver(name = "", lib = "") {
    const ver = "\x1b[33m" + getver(lib) + "\x1b[0m"
    print(`${name}: ${ver}`)
}

ver("astal")
ver("apps", "Apps")
ver("auth", "Auth")
ver("battery", "Battery")
ver("bluetooth", "Bluetooth")
ver("hyprland", "Hyprland")
ver("mpris", "Mpris")
ver("notifd", "Notifd")
ver("powerprofiles", "PowerProfiles")
ver("river", "River")
ver("tray", "Tray")
ver("wireplumber", "Wp")
