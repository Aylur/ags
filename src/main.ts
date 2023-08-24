import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Utils from './utils.js';
import App from './app.js';
import Client from './client.js';
import Service from './service/service.js';
import Widget from './widget.js';
import './service/apps.js';
import './service/audio.js';
import './service/battery.js';
import './service/bluetooth.js';
import './service/hyprland.js';
import './service/mpris.js';
import './service/network.js';
import './service/notifications.js';

const APP_BUS = (name: string) => 'com.github.Aylur.' + name;
const APP_PATH = (name: string) => '/com/github/Aylur/' + name;
const DEFAULT_CONF = `${GLib.get_user_config_dir()}/${pkg.name}/config.js`;

const help = (bin: string) => `USAGE:
    ${bin} [OPTIONS]

OPTIONS:
    -h, --help              Print this help and exit
    -v, --version           Print version and exit
    -q, --quit              Kills AGS
    -c, --config            Path to the config file. Default: ${DEFAULT_CONF}
    -b, --bus-name          Bus name of the process,
                            can be used to launch multiple instances
    -i, --inspector         Open up the Gtk debug tool,
                            useful for fetching css selectors
    -t, --toggle-window     Show or hide a window
    -r, --run-js            Evaluate given string as a function and execute it
                            NOTE: logging inside this function won't print
                            anything to the terminal, but it logs to the stdout
                            of the running AGS proccess
                            To print to the current stdout the string has to be
                            a single expression on a single line,
                            or call resolve() or reject() in the function body
    --clear-cache           Removes ${Utils.CACHE_DIR}

EXAMPLES
    ags --config $HOME/.config/ags/main.js --bus-name second-instance
    ags --run-js "ags.Service.Mpris.getPlayer()?.name"
    ags --run-js "ags.Utils.timeout(1000, () => {
        resolve('a second later');
    })"
    ags --toggle-window "window-name"`;

function isRunning(dbusName: string) {
    return Gio.DBus.session.call_sync(
        'org.freedesktop.DBus',
        '/org/freedesktop/DBus',
        'org.freedesktop.DBus',
        'NameHasOwner',
        // @ts-ignore
        GLib.Variant.new_tuple([new GLib.Variant('s', dbusName)]),
        new GLib.VariantType('(b)'),
        Gio.DBusCallFlags.NONE,
        -1,
        null,
    ).deepUnpack()?.toString() === 'true' || false;
}

export function main(args: string[]) {
    const flags = {
        busName: pkg.name,
        config: DEFAULT_CONF,
        inspector: false,
        runJs: '',
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

    // @ts-ignore
    globalThis.ags = {
        App,
        Utils,
        Widget,
        Service,
    };

    const bus = APP_BUS(flags.busName);
    const path = APP_PATH(flags.busName);

    if (!isRunning(bus)) {
        const app = new App(bus, path, flags.config);
        app.connect('config-parsed', () => {
            const { toggleWindow, runJs, inspector } = flags;
            const actions = Gio.DBusActionGroup.get(
                Gio.DBus.session, bus, path);

            if (toggleWindow) {
                actions.activate_action('toggle-window',
                    new GLib.Variant('s', toggleWindow));
            }

            if (runJs) {
                actions.activate_action('run-js',
                    new GLib.Variant('s', runJs));
            }

            if (inspector)
                actions.activate_action('inspector', null);
        });

        // @ts-ignore
        return app.runAsync(null);
    }
    else {
        // @ts-ignore
        return new Client(bus, path, flags).runAsync(null);
    }
}
