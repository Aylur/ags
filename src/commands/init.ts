import Gio from "gi://Gio"
import GLib from "gi://GLib"
import Astal from "gi://Astal"
import { exit } from "system"
import { stdout } from "@/lib/console"
import { fg } from "@/lib/colors"
import getConfig from "@/config"
import generateTypes from "./types"

type InitProps = {
    config: string
    typescript?: boolean
    jsx?: boolean
}

// TODO: interactive init
export default async function init({
    config,
    typescript = true,
    jsx = true,
}: InitProps) {
    if (GLib.file_test(config, GLib.FileTest.IS_DIR)) {
        stdout.err(`config directory ${fg.cyan(config)} already exists`)
        exit(1)
    }

    const gitignore = [
        "@girs/",
        "node_modules/",
    ]

    const { style, Bar, app } = getConfig(typescript, jsx)

    const tsconfig = JSON.stringify({
        extends: `${PKGDATADIR}/tsconfig`,
    }, null, 4)

    const env = `/// <reference path="${PKGDATADIR}/env.d.ts" />`

    Gio.File.new_for_path(`${config}/widget`).make_directory_with_parents(null)

    Astal.write_file(`${config}/.gitignore`, gitignore.join("\n"))
    Astal.write_file(`${config}/app.${app.extension}`, app.content)
    Astal.write_file(`${config}/style.css`, style)
    Astal.write_file(`${config}/tsconfig.json`, tsconfig)
    Astal.write_file(`${config}/env.d.ts`, env)
    Astal.write_file(`${config}/widget/Bar.${Bar.extension}`, Bar.content)

    await generateTypes(config, true)
    stdout.puts(`${fg.green("config ready")} at ${fg.cyan(config)}\n`)
    exit(0)
}
