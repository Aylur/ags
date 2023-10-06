import { readdir, writeFile, mkdir } from 'fs/promises';
import { dirname, basename } from 'path';
import { LibrariesOptions, generateDtsBundle } from 'dts-bundle-generator';

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

const modules = [...services, ...files];

const libraries: LibrariesOptions = {
    inlinedLibraries: [
        '@girs/gjs',
        '@girs/gtk-3.0',
        '@girs/gdk-3.0',
        '@girs/atk-3.0',
        '@girs/atk-1.0',
        '@girs/gio-2.0',
        '@girs/gmodule-2.0',
        '@girs/harfbuzz-0.0',
        '@girs/glib-2.0',
        '@girs/gobject-2.0',
        '@girs/pango-2.0',
        '@girs/pango-1.0',
        '@girs/xlib-2.0',
        '@girs/gdkpixbuf-2.0',
        '@girs/cairo-1.0',
        '@girs/freetype2-2.0',
        '@girs/dbusmenu-0.4',
        '@girs/gnomebluetooth-1.0',
        '@girs/dbusmenugtk3-0.4',
        '@girs/nm-1.0',
        '@girs/gvc-1.0',
        'gi://Gio',
        'gi://GObject',
        'gi://Gtk?version=3.0',
    ],
};

const entries = modules.map(service => ({
    filePath: filePath(service),
    servicePath: service,
    importPath: importPath(service),
    fileName: basename(service),
    failOnClass: false,
    libraries,
    output: {
        inlineDeclareExternals: true,
        inlineDeclareGlobals: true,
    },
}));

const generatedDts = generateDtsBundle(
    entries,
    {
        preferredConfigPath: './tsconfig.json',
    },
);

const generateOutFile = (file: string) => `_build/${file.replace('./src', 'src').replace('.ts', '.d.ts')}`;
let bundleFileImports = "import * as _ from './src/app'\n";
let bundleFileDeclarations = "";

for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    const outFile = generateOutFile(entry.filePath);
    const fileDir = dirname(outFile);

    await mkdir(fileDir, { recursive: true });

    await writeFile(outFile, generatedDts[i]);
    bundleFileImports += `
import * as ${entry.fileName.replace(".ts", "")} from '${entry.filePath.replace(".ts", "")}';
    `

    bundleFileDeclarations += `
declare module '${entry.importPath}' {
    export = ${entry.fileName.replace(".ts", "")};
}
    `
}

await writeFile('./_build/ags.d.ts', `${bundleFileImports}\n${bundleFileDeclarations}`);
