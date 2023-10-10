import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import { timeout, connect } from './utils.js';
import { loadInterfaceXML } from './utils.js';

const AgsIFace = (bus: string) =>
    loadInterfaceXML('com.github.Aylur.ags')?.replace('@BUS@', bus);

interface Config {
    windows?: Gtk.Window[]
    style?: string
    notificationPopupTimeout: number
    cacheNotificationActions: boolean
    closeWindowDelay: { [key: string]: number }
    maxStreamVolume: number
}

export default class App extends Gtk.Application {
    static {
        GObject.registerClass({
            Signals: {
                'window-toggled': {
                    param_types: [GObject.TYPE_STRING, GObject.TYPE_BOOLEAN],
                },
                'config-parsed': {},
            },
        }, this);
    }

    private _dbus!: Gio.DBusExportedObject;
    private _windows: Map<string, Gtk.Window>;
    private _closeDelay!: { [key: string]: number };
    private _cssProviders: Gtk.CssProvider[] = [];
    private _busName: string;
    private _objectPath: string;

    static configPath: string;
    static configDir: string;
    static config: Config;
    static instance: App;

    static removeWindow(w: Gtk.Window | string) { App.instance.removeWindow(w); }
    static addWindow(w: Gtk.Window) { App.instance.addWindow(w); }
    static get windows() { return App.instance._windows; }
    static getWindow(name: string) { return App.instance.getWindow(name); }
    static closeWindow(name: string) { App.instance.closeWindow(name); }
    static openWindow(name: string) { App.instance.openWindow(name); }
    static toggleWindow(name: string) { App.instance.toggleWindow(name); }
    static quit() { App.instance.quit(); }

    static resetCss() {
        const screen = Gdk.Screen.get_default();
        if (!screen) {
            console.error("couldn't get screen");
            return;
        }

        App.instance._cssProviders.forEach(provider => {
            Gtk.StyleContext.remove_provider_for_screen(screen, provider);
        });

        App.instance._cssProviders = [];
    }

    static applyCss(path: string) {
        const screen = Gdk.Screen.get_default();
        if (!screen) {
            console.error("couldn't get screen");
            return;
        }

        const cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_path(path);

        Gtk.StyleContext.add_provider_for_screen(
            screen,
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER,
        );

        App.instance._cssProviders.push(cssProvider);
    }

    constructor(bus: string, path: string, configPath: string) {
        super({
            application_id: bus,
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._busName = bus;
        this._objectPath = path;
        this._windows = new Map();

        const dir = configPath.split('/');
        dir.pop();
        App.configDir = dir.join('/');
        App.configPath = configPath;
        App.instance = this;
    }

    connectWidget(
        widget: Gtk.Widget,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (widget: Gtk.Widget, ...args: any[]) => void,
        event = 'window-toggled',
    ) {
        connect(this, widget, callback, event);
    }

    vfunc_activate() {
        this.hold();
        this._register();
        this._load();
    }

    toggleWindow(name: string) {
        const w = this.getWindow(name);
        if (w)
            w.visible ? this.closeWindow(name) : this.openWindow(name);
        else
            return 'There is no window named ' + name;
    }

    openWindow(name: string) {
        this.getWindow(name)?.show();
    }

    closeWindow(name: string) {
        const w = this.getWindow(name);
        if (!w || !w.visible)
            return;

        const delay = this._closeDelay[name];
        if (delay && w.visible) {
            timeout(delay, () => w.hide());
            this.emit('window-toggled', name, false);
        }
        else {
            w.hide();
        }
    }

    getWindow(name: string) {
        const w = this._windows.get(name);
        if (!w)
            console.error(Error(`There is no window named ${name}`));

        return w;
    }

    removeWindow(w: Gtk.Window | string) {
        const name = typeof w === 'string' ? w : w.name;

        const win = this._windows.get(name);
        if (!win) {
            console.error(Error('There is no window named ' + name));
            return;
        }

        win.destroy();
        this._windows.delete(name);
    }

    addWindow(w: Gtk.Window) {
        if (!(w instanceof Gtk.Window)) {
            console.error(Error(`${w} is not an instanceof Gtk.Window, ` +
                ` but it is of type ${typeof w}`));
            return;
        }

        w.connect('notify::visible',
            () => this.emit('window-toggled', w.name, w.visible));

        if (this._windows.has(w.name)) {
            console.error(Error('There is already a window named' + w.name));
            this.quit();
            return;
        }

        this._windows.set(w.name, w);
    }

    private async _load() {
        try {
            const mod = await import(`file://${App.configPath}`);
            const config = mod.default as Config;
            config.closeWindowDelay ||= {};
            config.notificationPopupTimeout ||= 3000;
            config.maxStreamVolume ||= 1.5;
            config.cacheNotificationActions ||= false;
            App.config = config;

            if (!config) {
                console.error('Missing default export');
                this.emit('config-parsed');
                return;
            }

            this._closeDelay = config.closeWindowDelay;

            if (config.style)
                App.applyCss(config.style);

            if (config.windows && !Array.isArray(config.windows)) {
                console.error('windows attribute has to be an array, ' +
                    `but it is a ${typeof config.windows}`);
                this.emit('config-parsed');
                return;
            }

            config.windows?.forEach(this.addWindow.bind(this));

            this.emit('config-parsed');
        } catch (err) {
            console.error(err as Error);
        }
    }

    private _register() {
        Gio.bus_own_name(
            Gio.BusType.SESSION,
            this._busName,
            Gio.BusNameOwnerFlags.NONE,
            (connection: Gio.DBusConnection) => {
                this._dbus = Gio.DBusExportedObject
                    .wrapJSObject(AgsIFace(this._busName) as string, this);

                this._dbus.export(connection, this._objectPath);
            },
            null,
            null,
        );
    }

    RunJs(js: string): string {
        return js.includes(';')
            ? `${Function(js)()}`
            : `${Function('return ' + js)()}`;
    }

    RunPromise(js: string, busName?: string, objPath?: string) {
        new Promise((res, rej) => Function('resolve', 'reject', js)(res, rej))
            .then(out => {
                if (busName && objPath) {
                    Gio.DBus.session.call(
                        busName, objPath, busName, 'Print',
                        new GLib.Variant('(s)', [`${out}`]),
                        null, Gio.DBusCallFlags.NONE, -1, null, null,
                    );
                }
                else { print(`${out}`); }
            })
            .catch(console.error);
    }

    ToggleWindow(name: string) {
        this.toggleWindow(name);
        return `${this.getWindow(name)?.visible}`;
    }

    Inspector() { Gtk.Window.set_interactive_debugging(true); }

    Quit() { this.quit(); }
}
