import { readdir, writeFile, lstat, readFile } from 'fs/promises';
import { join } from 'path';
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
    "Soup-3.0",
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

const { stdout, stderr } = await exec('npx tsc --emitDeclarationOnly --declarationDir types --skipLibCheck --noEmit false');

if (stderr) {
    console.error(stderr);
}

console.log(stdout);

// transform the files to add the correct imports

/** finds the relative path of the gtk-types directory. Takes in the current dir as an input (may be the file itself) */
const findGtkTypesPath = async (currentDir: string, outputDir: string = ""): Promise<string> => {
	// make sure we aren't a file
	if (await lstat(currentDir).then(stat => stat.isFile())) {
		return await findGtkTypesPath(join(currentDir, '..'), outputDir);
	}

	// check if there is a gtk-types directory
	if (await lstat(join(currentDir, 'gtk-types')).then(stat => stat.isDirectory()).catch(() => false)) {
		if (outputDir === "") {
			return "./gtk-types";
		}
		return join(outputDir, 'gtk-types');
	}

	// otherwise, recurse
	return await findGtkTypesPath(join(currentDir, '..'), join(outputDir, '..'));
}

const bundleFileImports = async (currentDir: string) => {
	const pathToGtkTypes = await findGtkTypesPath(currentDir);
	return libraries.map(lib => `import "${pathToGtkTypes}/${lib.toLowerCase()}-ambient";`).join('\n')
}

async function recursivelyUpdateDtsFiles(dir: string) {
	const dirFiles = await readdir(dir);
	for (const fileWithoutDir of dirFiles) {
		const file = join(dir, fileWithoutDir);

		if (file === "types/gtk-types") {
			continue;
		}

		if (file === "ags.d.ts") {
			continue;
		}

		if (await lstat(file).then(stat => stat.isDirectory())) {
			await recursivelyUpdateDtsFiles(file);
		} else if (file.endsWith('.d.ts')) {
			const fileContent = await readFile(file, 'utf-8');
			const newFileContent = `${await bundleFileImports(file)}\n${fileContent}`;
			await writeFile(file, newFileContent);
		}
	}
}

await recursivelyUpdateDtsFiles('./types');

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
    importPath: importPath(service),
}));


let bundleFileDeclarations = entries.map(entry => `
declare module '${entry.importPath}' {
    const exports: typeof import('${entry.filePath.replace("/src", "")}')
    export = exports
}
`).join('\n');

await writeFile('./types/ags.d.ts', `${await bundleFileImports('./types')}\n${bundleFileDeclarations}`);
