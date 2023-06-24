import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Utils from './utils.js';
import App from './app.js';
import Window from './window.js';
import Widget from './widget.js';
import Applications from './service/apps.js';
import Audio from './service/audio.js';
import Battery from './service/battery.js';
import Bluetooth from './service/bluetooth.js';
import Hyprland from './service/hyprland.js';
import Mpris from './service/mpris.js';
import Network from './service/network.js';
import Notifications from './service/notifications.js';

const APP_BUS = 'com.github.Aylur.'+pkg.name;
const APP_PATH = '/com/github/Aylur/'+pkg.name;

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
        print(Utils.help(args[0]));
        return;

    case 'clear-cache':
        Utils.exec(`rm -r ${Utils.CACHE}`);
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
        Service: {
            Applications,
            Audio,
            Battery,
            Bluetooth,
            Hyprland,
            Mpris,
            Network,
            Notifications,
        },
    };

    if (!Utils.isRunning(APP_BUS))
        return new App().run(null);

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

    default:
        print(Utils.help(args[0]));
        return;
    }
}
