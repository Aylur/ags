import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Utils from './utils.js';
import app from './app.js';
import client from './client.js';

const BIN_NAME = pkg.name.split('.').pop() as string;
const APP_BUS = (name: string) => `${pkg.name}.${name}`;
const APP_PATH = (name: string) => `/${pkg.name.split('.').join('/')}/${name}`;
const DEFAULT_CONF = `${GLib.get_user_config_dir()}/${BIN_NAME}/config.js`;

const help = (bin: string) => `USAGE:
    ${bin} [OPTIONS]

OPTIONS:
    -h, --help              Print this help and exit
    -v, --version           Print version and exit
    -q, --quit              Kill AGS
    -c, --config            Path to the config file. Default: ${DEFAULT_CONF}
    -b, --bus-name          Bus name of the process
    -i, --inspector         Open up the Gtk debug tool
    -t, --toggle-window     Show or hide a window
    -r, --run-js            Evaluate given string as a function and execute it
    -p, --run-promise       Evaluate and execute function as Promise
    --clear-cache           Remove ${Utils.CACHE_DIR}`;

function isRunning(dbusName: string) {
    return Gio.DBus.session.call_sync(
        'org.freedesktop.DBus',
        '/org/freedesktop/DBus',
        'org.freedesktop.DBus',
        'NameHasOwner',
        // @ts-expect-error
        GLib.Variant.new_tuple([new GLib.Variant('s', dbusName)]),
        new GLib.VariantType('(b)'),
        Gio.DBusCallFlags.NONE,
        -1,
        null,
    ).deepUnpack()?.toString() === 'true' || false;
}

export function main(args: string[]) {
    const flags = {
        busName: BIN_NAME,
        config: DEFAULT_CONF,
        inspector: false,
        runJs: '',
        runPromise: '',
        toggleWindow: '',
        quit: false,
    };

    for (let i = 1; i < args.length; ++i) {
        switch (args[i]) {
            case 'version':
            case '-v':
            case '--version':
                print(pkg.version);
                return;

            case 'help':
            case '-h':
            case '--help':
                print(help(args[0]));
                return;

            case 'clear-cache':
            case '--clear-cache':
                Utils.execAsync(`rm -r ${Utils.CACHE_DIR}`);
                break;

            case '-b':
            case '--bus-name':
                flags.busName = args[++i];
                break;

            case '-c':
            case '--config':
                flags.config = args[++i];
                break;

            case 'inspector':
            case '-i':
            case '--inspector':
                flags.inspector = true;
                break;

            case 'run-js':
            case '-r':
            case '--run-js':
                flags.runJs = args[++i];
                break;

            case 'run-promise':
            case '-p':
            case '--run-promise':
                flags.runPromise = args[++i];
                break;

            case 'toggle-window':
            case '-t':
            case '--toggle-window':
                flags.toggleWindow = args[++i];
                break;

            case 'quit':
            case '-q':
            case '--quit':
                flags.quit = true;
                break;

            default:
                console.error(`unknown option: ${args[i]}`);
                break;
        }
    }

    const bus = APP_BUS(flags.busName);
    const path = APP_PATH(flags.busName);

    if (!isRunning(bus)) {
        if (flags.quit)
            return;

        app.setup(bus, path, flags.config);
        app.connect('config-parsed', () => {
            if (flags.toggleWindow)
                app.ToggleWindow(flags.toggleWindow);

            if (flags.runJs)
                app.RunJs(flags.runJs);

            if (flags.runPromise)
                app.RunPromise(flags.runPromise);

            if (flags.inspector)
                app.Inspector();
        });

        // @ts-expect-error
        return app.runAsync(null);
    }
    else {
        return client(bus, path, flags);
    }
}
