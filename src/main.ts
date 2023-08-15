import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Utils from './utils.js';
import App from './app.js';
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
const APP_PATH = '/com/github/Aylur/' + pkg.name;

const help = (bin: string) => `USAGE:
    ${bin} [COMMAND] <ARGUMENTS>

COMMANDS:
    help\t\tPrint this help
    version\t\tPrint version
    quit\t\tKills ags
    clear-cache\t\tRemoves ${Utils.CACHE_DIR}
    toggle-window name\tToggle window
    run-js string\tRuns string as a js function
    inspector\t\tOpen debugger`;

function client(bus: string, inspector: boolean, runJs: string, toggleWindow: string, quit: boolean) {
    const actions = Gio.DBusActionGroup.get(
        Gio.DBus.session, bus, APP_PATH);

    if (toggleWindow)
        actions.activate_action('toggle-window', new GLib.Variant('s', toggleWindow));

    if (runJs)
        actions.activate_action('run-js', new GLib.Variant('s', runJs));

    if (inspector)
        actions.activate_action('inspector', null);

    if (quit)
        actions.activate_action('quit', null);
}

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
    let appBus = pkg.name;
    let config = `${GLib.get_user_config_dir()}/${pkg.name}/config.js`;
    let inspector = false;
    let runJs = '';
    let toggleWindow = '';
    let quit = false;

    args.forEach((arg, i) => {
        switch (arg) {
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
                appBus = args[i + 1];
                break;

            case '-c':
            case '--config':
                config = args[i + 1];
                break;

            case 'inspector':
            case '-i':
            case '--inspector':
                inspector = true;
                break;

            case 'run-js':
            case '-r':
            case '--run-js':
                runJs = args[i + 1];
                break;

            case 'toggle-window':
            case '-t':
            case '--toggle-window':
                toggleWindow = args[i + 1];
                break;

            case 'quit':
            case '-q':
            case '--quit':
                quit = true;
                break;

            default:
                break;
        }
    });

    // @ts-ignore
    globalThis.ags = {
        App,
        Utils,
        Widget,
        Service,
    };

    const bus = APP_BUS(appBus);
    if (!isRunning(bus)) {
        const app = new App({ bus, config });
        app.connect('config-parsed', () => {
            client(bus, inspector, runJs, toggleWindow, quit);
        });

        // @ts-ignore
        return app.runAsync(null);
    }

    client(bus, inspector, runJs, toggleWindow, quit);

    if (args.length === 1)
        print('Ags is already running');
}
