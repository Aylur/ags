import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import { timeout, connect } from './utils.js';

interface Config {
    windows?: Gtk.Window[]
    style?: string
    notificationPopupTimeout?: number
    closeWindowDelay?: { [key: string]: number }
    mediaCacheSize?: number
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

    private _windows: Map<string, Gtk.Window>;
    private _closeDelay!: { [key: string]: number };
    private _cssProviders: Gtk.CssProvider[] = [];

    static configPath: string;
    static configDir: string;
    static config: Config;
    static instance: App;

    // eslint-disable-next-line max-len
    static removeWindow(w: Gtk.Window | string) { App.instance.removeWindow(w); }
    static addWindow(w: Gtk.Window) { App.instance.addWindow(w); }
    static get windows() { return App.instance._windows; }
    static getWindow(name: string) { return App.instance.getWindow(name); }
    static closeWindow(name: string) { App.instance.closeWindow(name); }
    static openWindow(name: string) { App.getWindow(name)?.show(); }
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

    constructor({ bus, config }: {
        bus: string
        config: string
    }) {
        super({
            application_id: bus,
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._windows = new Map();

        const dir = config.split('/');
        dir.pop();
        App.configDir = dir.join('/');
        App.configPath = config;
        App.instance = this;
    }

    connectWidget(
        widget: Gtk.Widget,
        callback: (widget: Gtk.Widget, ...args: any[]) => void,
        event = 'window-toggled',
    ) {
        connect(this, widget, callback, event);
    }

    vfunc_activate() {
        this.hold();
        this._load();
        this._exportActions();
    }

    toggleWindow(name: string) {
        const w = this.getWindow(name);
        if (w)
            w.visible ? App.closeWindow(name) : App.openWindow(name);
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
            console.error(`There is no window named ${name}`);

        return w;
    }

    removeWindow(w: Gtk.Window | string) {
        const name = typeof w === 'string' ? w : w.name;

        const win = this._windows.get(name);
        if (!win) {
            console.error('There is no window named ' + name);
            return;
        }

        win.destroy();
        this._windows.delete(name);
    }

    addWindow(w: Gtk.Window) {
        if (!(w instanceof Gtk.Window)) {
            console.error(`${w} is not an instanceof Gtk.Window, ` +
                ` but it is of type ${typeof w}`);
            return;
        }

        w.connect('notify::visible',
            () => this.emit('window-toggled', w.name, w.visible));

        if (this._windows.has(w.name)) {
            console.error('There is already a window named' + w.name);
            this.quit();
            return;
        }

        this._windows.set(w.name, w);
    }

    async _load() {
        try {
            const mod = await import(`file://${App.configPath}`);
            const config = mod.default as Config;
            App.config = config;

            if (!config) {
                console.error('Missing default export');
                this.emit('config-parsed');
                return;
            }

            this._closeDelay = config.closeWindowDelay || {};

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
            logError(err as Error);
        }
    }

    _addAction(
        name: string,
        callback: (_source: Gio.SimpleAction, _param: GLib.Variant) => void,
        parameter_type?: GLib.VariantType,
    ) {
        const action = parameter_type
            ? new Gio.SimpleAction({ name, parameter_type })
            : new Gio.SimpleAction({ name });
        action.connect('activate', callback);
        this.add_action(action);
    }

    _exportActions() {
        this._addAction('inspector',
            () => Gtk.Window.set_interactive_debugging(true));
        this._addAction('quit', App.quit);

        this._addAction('toggle-window', (_, arg) => App.toggleWindow(
            arg.unpack() as string), new GLib.VariantType('s'));

        this._addAction('run-js', (_, arg) => {
            const fn = new Function(arg.unpack() as string);
            fn();
        }, new GLib.VariantType('s'));
    }
}
