import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Window from './window.js';
import { error, warning, getConfig, timeout } from './utils.js';

const APP_BUS = 'com.github.Aylur.'+pkg.name;

export default class App extends Gtk.Application {
    private _windows: Map<string, Gtk.Window>;
    private _closeDelay!: { [key: string]: number };

    static _instance: App;

    static {
        GObject.registerClass({
            Signals: {
                'window-toggled': {
                    param_types: [GObject.TYPE_STRING, GObject.TYPE_BOOLEAN],
                },
            },
        }, this);
    }

    static connect(event: string, callback: () => void): number {
        return App._instance.connect(event, callback);
    }

    static getWindow(name: string): Gtk.Window | undefined {
        return App._instance._windows.get(name);
    }

    static toggleWindow(name: string) {
        const window = App.getWindow(name);

        if (window) {
            const delay = App._instance._closeDelay[name];
            if (delay && window.visible) {
                timeout(delay, () => window.hide());
                App._instance.emit('window-toggled', name, false);
            }
            else {
                window.visible = !window.visible;
                App._instance.emit('window-toggled', name, window.visible);
            }
            return;
        }

        warning(`There is no window named ${name}`);
    }

    static quit() {
        App._instance.quit();
    }

    static applyCss(path: string) {
        const cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_path(path);

        const screen = Gdk.Screen.get_default();
        if (!screen)
            return;

        Gtk.StyleContext.add_provider_for_screen(
            screen,
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER,
        );
    }

    constructor() {
        super({
            application_id: APP_BUS,
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._windows = new Map();
        App._instance = this;
    }

    vfunc_activate() {
        this.hold();
        this._load();
        this._exportActions();
    }

    _load() {
        for (const [name, window] of this._windows) {
            window.destroy();
            this._windows.delete(name);
        }

        const config = getConfig();
        if (!config) {
            error('No config was provided or there was an error');
            return;
        }

        this._closeDelay = config.closeWindowDelay || {};

        if (config.style)
            App.applyCss(config.style);

        config.windows?.forEach(window => {
            const w = Window(window);

            if (this._windows.has(w.name)) {
                error('name of window has to be unique!');
                return;
            }

            this._windows.set(w.name, w);
        });
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

        this._addAction('toggle-window', (_, arg) =>
            App.toggleWindow(arg.unpack() as string), new GLib.VariantType('s'));

        this._addAction('run-js', (_, arg) => {
            const fn = new Function(arg.unpack() as string);
            fn();
        }, new GLib.VariantType('s'));
    }
}
