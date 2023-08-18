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
}

export default class App extends Gtk.Application {
    private _windows: Map<string, Gtk.Window>;
    private _closeDelay!: { [key: string]: number };
    private _cssProviders: Gtk.CssProvider[] = [];

    static configPath: string;
    static configDir: string;
    static config: Config;
    static instance: App;

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

    static get windows() {
        return App.instance._windows;
    }

    static getWindow(name: string) {
        const w = App.instance._windows.get(name);
        return w ? w : console.error(`There is no window named ${name}`);
    }

    static closeWindow(name: string) {
        const w = App.getWindow(name);
        if (!w || !w.visible)
            return;

        const delay = App.instance._closeDelay[name];
        if (delay && w.visible) {
            timeout(delay, () => w.hide());
            App.instance.emit('window-toggled', name, false);
        }
        else {
            w.hide();
        }
    }

    static openWindow(name: string) {
        App.getWindow(name)?.show();
    }

    static toggleWindow(name: string) {
        const w = App.getWindow(name);
        if (!w)
            return;

        w.visible ? App.closeWindow(name) : App.openWindow(name);
    }

    static quit() {
        App.instance.quit();
    }

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

    connectWidget(
        widget: Gtk.Widget,
        callback: (widget: Gtk.Widget, ...args: any[]) => void,
        event = 'window-toggled',
    ) {
        connect(this, widget, callback, event);
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

    vfunc_activate() {
        this.hold();
        this._load();
        this._exportActions();
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
                console.error(`windows attribute has to be an array, but it is a ${typeof config.windows}`);
                this.emit('config-parsed');
                return;
            }

            config.windows?.forEach(w => {
                if (!(w instanceof Gtk.Window)) {
                    console.error(`${w} is not an instanceof Gtk.Window, but ${typeof w}`);
                    return;
                }

                w.connect('notify::visible',
                    () => this.emit('window-toggled', w.name, w.visible));

                if (this._windows.has(w.name)) {
                    console.error('name of window has to be unique!');
                    this.quit();
                    return;
                }

                this._windows.set(w.name, w);
            });

            this.emit('config-parsed');
        } catch (_) {
            print(`No config found at ${App.configPath}`);
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
        this._addAction('inspector', () => Gtk.Window.set_interactive_debugging(true));
        this._addAction('quit', App.quit);

        this._addAction('toggle-window', (_, arg) =>
            App.toggleWindow(arg.unpack() as string), new GLib.VariantType('s'));

        this._addAction('run-js', (_, arg) => {
            const fn = new Function(arg.unpack() as string);
            fn();
        }, new GLib.VariantType('s'));
    }
}
