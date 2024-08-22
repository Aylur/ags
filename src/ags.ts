#!/usr/bin/gjs -m

import GLib from "gi://GLib"
import { exit, programArgs } from "system"
import { defaultConfigDir } from "@/config"
import { stdout } from "@/lib/console"
import * as cmd from "@/commands"

if (programArgs.length == 0 && !GLib.file_test(defaultConfigDir, GLib.FileTest.EXISTS)) {
    cmd.help()
}

let instance = "astal"
let config = defaultConfigDir
let inspector = false
let quit = false
let init = false
let toggleWindow = ""
let genTypes = false
let message = ""

for (let i = 0; i < programArgs.length; ++i) {
    switch (programArgs[i]) {
        case "-h":
        case "--help":
            cmd.help()

        case "-v":
        case "--version":
            await cmd.version()

        case "-l":
        case "--list":
            cmd.list()

        case "-q":
        case "--quit":
            quit = true
            break

        case "-i":
        case "--instance":
            instance = programArgs[++i]
            break

        case "-m":
        case "--message":
            message = programArgs[++i]
            break

        case "-I":
        case "--inspector":
            inspector = true
            break

        case "-g":
        case "--generate-types":
            genTypes = true
            break

        case "-t":
        case "--togge-window":
            toggleWindow = programArgs[++i]
            break

        case "-c":
        case "--config": {
            config = GLib.canonicalize_filename(programArgs[++i] ?? ".", null)
            break
        }
        case "--init":
            init = true
            break

        default:
            stdout.err(`unknown flag ${programArgs[i]}\n`)
            exit(1)
            break
    }
}

if (inspector)
    cmd.inspector(instance)

if (toggleWindow)
    cmd.toggle(instance, toggleWindow)

if (quit)
    cmd.quit(instance)

if (message)
    cmd.message(instance, message)

if (init)
    await cmd.init({ config })

if (genTypes)
    await cmd.generateTypes(config)

await cmd.run(config)
