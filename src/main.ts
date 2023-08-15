import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Utils from './utils.js';
import App from './app.js';
import Service from './service/service.js';
import Window from './window.js';
import Widget from './widget.js';
import './service/apps.js';
import './service/audio.js';
import './service/battery.js';
import './service/bluetooth.js';
import './service/hyprland.js';
import './service/mpris.js';
import './service/network.js';
import './service/notifications.js';

const APP_BUS = 'com.github.Aylur.' + pkg.name;
const APP_PATH = '/com/github/Aylur/' + pkg.name;

export const help = (bin: string) => `USAGE:
    ${bin} [COMMAND] <ARGUMENTS>

COMMANDS:
    help\t\tPrint this help
    version\t\tPrint version
    quit\t\tKills ags
    clear-cache\t\tRemoves ${Utils.CACHE_DIR}
    toggle-window name\tToggle window
    run-js string\tRuns string as a js function
    inspector\t\tOpen debugger`;

export function main(args: string[]) {
    switch (args[1]) {
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
            Utils.exec(`rm -r ${Utils.CACHE_DIR}`);
            return;

        default:
            break;
    }

    // @ts-ignore
    globalThis.ags = {
        App,
        Utils,
        Window,
        Widget,
        Service,
    };

    if (!Utils.isRunning(APP_BUS))
        // @ts-ignore
        return new App().runAsync(null);

    const actions = Gio.DBusActionGroup.get(
        Gio.DBus.session, APP_BUS, APP_PATH,
    );

    switch (args[1]) {
        case 'toggle-window':
            actions.activate_action('toggle-window', new GLib.Variant('s', args[2]));
            return;

        case 'run-js':
            actions.activate_action('run-js', new GLib.Variant('s', args[2]));
            return;

        case 'inspector':
            actions.activate_action('inspector', null);
            return;

        case 'quit':
            actions.activate_action('quit', null);
            return;

        default:
            print(help(args[0]));
            return;
    }
}
