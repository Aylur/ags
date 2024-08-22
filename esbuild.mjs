import { build } from "esbuild"
import inline from "esbuild-plugin-inline-import"

function env(env) {
    return `"${process.env[env]}"`
}

await build({
    entryPoints: [process.env.AGS_INFILE ?? "src/ags"],
    bundle: true,
    outfile: process.env.AGS_OUTFILE ?? "dist/ags",
    format: "esm",
    platform: "neutral",
    // minify: true,
    external: [
        "console",
        "system",
        "cairo",
        "gettext",
        "file://*",
        "gi://*",
        "resource://*",
    ],
    define: {
        AGS_BUNDLER: env("AGS_BUNDLER"),
        ASTAL_GJS: env("ASTAL_GJS"),
        NPX: env("NPX"),
        PKGDATADIR: env("PKGDATADIR"),
        VERSION: env("VERSION"),
        XDG_DATA_DIRS: env("XDG_DATA_DIRS"),
    },
    plugins: [
        inline(),
    ],
})
