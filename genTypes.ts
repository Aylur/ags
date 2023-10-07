import { readdir, writeFile, mkdir } from 'fs/promises';
import { dirname, basename, join } from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { ModuleLoader, GenerationHandler } from "@ts-for-gir/cli"

const exec = promisify(_exec);

// generate required types for gtk

const libraries = [
    "Gtk-3.0",
    "Gdk-3.0",
    "Cairo-1.0",
    "GnomeBluetooth-3.0",
    "DbusmenuGtk3-0.4",
    "GObject-2.0",
    "NM-1.0",
    "gvc-1.0"
]

// taken from https://github.com/gjsify/ts-for-gir/blob/3.x/packages/cli/src/config.ts#L524
function getDefaultGirDirectories(): string[] {
    const girDirectories = [
        '/usr/local/share/gir-1.0',
        '/usr/share/gir-1.0',
        '/usr/share/gnome-shell',
        '/usr/share/gnome-shell/gir-1.0',
        '/usr/lib64/mutter-10',
        '/usr/lib64/mutter-11',
        '/usr/lib64/mutter-12',
        '/usr/lib/x86_64-linux-gnu/mutter-10',
        '/usr/lib/x86_64-linux-gnu/mutter-11',
        '/usr/lib/x86_64-linux-gnu/mutter-12',
    ]
    // NixOS and other distributions does not have a /usr/local/share directory.
    // Instead, the nix store paths with Gir files are set as XDG_DATA_DIRS.
    // See https://github.com/NixOS/nixpkgs/blob/96e18717904dfedcd884541e5a92bf9ff632cf39/pkgs/development/libraries/gobject-introspection/setup-hook.sh#L7-L10
    const dataDirs = process.env['XDG_DATA_DIRS']?.split(':') || []
    for (let dataDir of dataDirs) {
        dataDir = join(dataDir, 'gir-1.0')
        if (!girDirectories.includes(dataDir)) {
            girDirectories.push(dataDir)
        }
    }
    return girDirectories
}

const config = {
    environment: 'gjs',
    root: './',
    outdir: 'types/gtk-types',
    buildType: 'types',
    moduleType: 'esm',
    girDirectories: getDefaultGirDirectories(),
    verbose: false,
    noNamespace: false,
    noComments: false,
    noDebugComments: false,
    fixConflicts: true,
    generateAlias: false,
    promisify: true,
    npmScope: '',
    package: false,
    packageYarn: false
} as const

const moduleLoader = new ModuleLoader(config);
const { keep, grouped } = await moduleLoader.getModulesResolved(
    libraries,
    [],
    false,
)

if (keep.length === 0) {
    throw new Error('No modules found. Make sure you have installed gtk dev libraries');
}

// 0 = TYPES
const gtkTypeGen = new GenerationHandler(config, 0);

const girModules = Array.from(keep).map((girModuleResolvedBy) => girModuleResolvedBy.module)
const girModulesGrouped = Object.values(grouped)

await gtkTypeGen.start(girModules, girModulesGrouped);

// generate types for ags

const { stdout, stderr } = await exec('npx tsc --emitDeclarationOnly --declarationDir types');

if (stderr) {
    console.error(stderr);
}

console.log(stdout);

/**
 * Creates a path that dts-buddy can type
 * @param file The file to create a path for
 */
const importPath = (file: string) => `resource:///com/github/Aylur/ags/${file}.js`;

/**
 * Creates a path that dts-buddy can type
 * @param file The file to generate types for
 */
const filePath = (file: string) => `./src/${file}.ts`;

const files = [
    'app',
    'utils',
    'service',
    'variable',
    'widget',
];


const removeFileExtension = (file: string) => file.replace(/\.[^/.]+$/, '');
const services =
	(await readdir('./src/service'))
	    .map(removeFileExtension)
	    .map(file => `service/${file}`);

const modules: string[] = [...services, ...files];

const entries = modules.map(service => ({
    filePath: filePath(service).replace('.ts', ''),
    servicePath: service,
    importPath: importPath(service),
    fileName: basename(service).replace('.ts', ''),
    // convert file path to camel case
    moduleName: service.split('/').map((part, i) => i === 0 ? part : part[0].toUpperCase() + part.slice(1)).join(''),
}));

let bundleFileImports = libraries.map(lib => `/// <reference path="./gtk-types/${lib.toLowerCase()}-ambient.d.ts">`).join('\n')
let bundleFileDeclarations = "";

for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    bundleFileDeclarations += `
declare module '${entry.importPath}' {
    const exports: typeof import('${entry.filePath.replace("/src", "")}')
    export = exports
}
    `
}

await writeFile('./types/ags.d.ts', `${bundleFileImports}\n${bundleFileDeclarations}`);
