import "./gtk-types/gtk-3.0-ambient";
import "./gtk-types/gdk-3.0-ambient";
import "./gtk-types/cairo-1.0-ambient";
import "./gtk-types/gnomebluetooth-3.0-ambient";
import "./gtk-types/dbusmenugtk3-0.4-ambient";
import "./gtk-types/gobject-2.0-ambient";
import "./gtk-types/nm-1.0-ambient";
import "./gtk-types/soup-3.0-ambient";
import "./gtk-types/gvc-1.0-ambient";
import Gtk from 'gi://Gtk?version=3.0';
interface Config {
    windows?: InstanceType<typeof Gtk.Window>[];
    style?: string;
    notificationPopupTimeout: number;
    cacheNotificationActions: boolean;
    closeWindowDelay: {
        [key: string]: number;
    };
    maxStreamVolume: number;
}
declare class App extends Gtk.Application {
    private _dbus;
    private _closeDelay;
    private _cssProviders;
    private _objectPath;
    private _windows;
    private _configPath;
    private _configDir;
    private _config;
    get windows(): Map<string, import("../types/gtk-types/gtk-3.0.js").Gtk.Window>;
    get configPath(): string;
    get configDir(): string;
    get config(): Config;
    resetCss(): void;
    applyCss(path: string): void;
    setup(bus: string, path: string, configPath: string): void;
    connectWidget(widget: InstanceType<typeof Gtk.Widget>, callback: (widget: InstanceType<typeof Gtk.Widget>, ...args: unknown[]) => void, event?: string): void;
    vfunc_activate(): void;
    toggleWindow(name: string): string | undefined;
    openWindow(name: string): void;
    closeWindow(name: string): void;
    getWindow(name: string): import("../types/gtk-types/gtk-3.0.js").Gtk.Window | undefined;
    removeWindow(w: InstanceType<typeof Gtk.Window> | string): void;
    addWindow(w: InstanceType<typeof Gtk.Window>): void;
    private _load;
    private _register;
    RunJs(js: string): string;
    RunPromise(js: string, busName?: string, objPath?: string): void;
    ToggleWindow(name: string): string;
    Inspector(): void;
    Quit(): void;
}
declare const _default: App;
export default _default;
