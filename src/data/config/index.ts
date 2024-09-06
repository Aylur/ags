import GLib from "gi://GLib"

import js from "inline:./js/Bar.js"
import jsx from "inline:./js/Bar.jsx"

import ts from "inline:./ts/Bar.ts"
import tsx from "inline:./ts/Bar.tsx"

import app from "inline:./app.ts"

import style from "inline:./style.css"

export default function getConfig(typescript: boolean, react: boolean) {
    const lang = typescript ? "ts" : "js" as const
    const xml = `${lang}x` as const

    return {
        style,
        app: {
            extension: lang,
            content: app,
        },
        Bar: {
            extension: xml,
            content: react
                ? (typescript ? tsx : jsx)
                : (typescript ? ts : js)
        },
    } as const
}

export const defaultConfigDir = `${GLib.get_user_config_dir()}/ags`
