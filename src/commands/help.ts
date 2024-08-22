import { exit, programInvocationName } from "system"
import { fg, underscore } from "@/lib/colors"
import { stdout } from "@/lib/console"

function section(name: string) {
    return `${underscore(fg.green(name))}:`
}

function flag(short: string, long: string, description: string) {
    return `${fg.blue(`-${short}`)}, ${fg.blue(`--${long}`)}`
        + `${fg.yellow(description)}`
}

const helptext = `${section("Usage")}
    ${programInvocationName} [OPTIONS] message

${section("Options")}
    ${flag("h", "help", "       Print this help and exit")}
    ${flag("v", "version", "    Print version number and exit")}
    ${flag("c", "config", `     Configuration directory.`)}
    ${flag("l", "list", "       List running instances and exit")}
    ${flag("q", "quit", "       Quit an instance")}
    ${flag("m", "message", "    Send message to an instance")}
    ${flag("I", "inspector", "  Open up Gtk debug tool")}
    ${flag("t", "toggle", "     Show or hide a window")}
    ${flag("i", "instance", "   Name of the instance")}
    ${flag("g", "generate", "   Generate TypeScript types")}
    ${fg.blue("--init")}${fg.yellow("           Initialize the configuration directory")}
`

export default function help() {
    stdout.puts(helptext)
    exit(0)
}
