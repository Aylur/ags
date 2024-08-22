import { stdout } from "@/lib/console"
import Astal from "gi://Astal"
import GLib from "gi://GLib"
import { exit } from "system"
import { path } from "@/lib/path"

const RUNDIR = `${GLib.get_user_runtime_dir()}/ags`
const outfile = `${RUNDIR}/app`

export default async function run(config: string) {
    try {
        const { dir, file } = path(config)

        Astal.Process.execv([
            AGS_BUNDLER,
            "-entry", `${dir}/${file}`,
            "-outfile", outfile,
        ])

        // TODO: --watch flag
        // monitor file and restart as child process
        await import(`file://${outfile}`)
    } catch (error) {
        stdout.err(error)
        exit(1)
    }
}
