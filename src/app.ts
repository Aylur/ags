import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Window from './window.js';
import { error, warning, getConfig, timeout, connect } from './utils.js';

const APP_BUS = 'com.github.Aylur.' + pkg.name;

export default class App extends Gtk.Application {
    private _windows: Map<string, Gtk.Window>;
    private _closeDelay!: { [key: string]: number };
    private _cssProviders: Gtk.CssProvider[] = [];

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
        return w ? w : warning(`There is no window named ${name}`);
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
            error("couldn't get screen");
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
            error("couldn't get screen");
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

    constructor() {
        super({
            application_id: APP_BUS,
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._windows = new Map();
        App.instance = this;
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
            this.quit();
            return;
        }

        this._closeDelay = config.closeWindowDelay || {};

        if (config.style)
            App.applyCss(config.style);

        config.windows?.forEach(window => {
            const w = Window(window);
            w.connect('notify::visible', () => this.emit('window-toggled', w.name, w.visible));

            if (this._windows.has(w.name)) {
                error('name of window has to be unique!');
                return;
            }

            this._windows.set(w.name, w);
        });

        this.emit('config-parsed');
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
