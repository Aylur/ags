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
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import { Command } from './widgets/constructor.js';
export declare const USER: string;
export declare const CACHE_DIR: string;
export declare function readFile(path: string): string;
export declare function readFileAsync(path: string): Promise<string>;
export declare function writeFile(string: string, path: string): Promise<InstanceType<typeof Gio.File>>;
export declare function loadInterfaceXML(iface: string): string | null;
export declare function bulkConnect(service: InstanceType<typeof GObject.Object>, list: [
    event: string,
    callback: (...args: any[]) => void
][]): number[];
export declare function bulkDisconnect(service: InstanceType<typeof GObject.Object>, ids: number[]): void;
export declare function connect<Widget extends InstanceType<typeof Gtk.Widget>>(service: InstanceType<typeof GObject.Object>, widget: Widget, callback: (widget: Widget, ...args: unknown[]) => void, event?: string): void;
export declare function interval(interval: number, callback: () => void, bind?: InstanceType<typeof Gtk.Widget>): number;
export declare function timeout(ms: number, callback: () => void): number;
export declare function runCmd(cmd: Command, ...args: unknown[]): boolean;
export declare function lookUpIcon(name?: string, size?: number): import("../types/gtk-types/gtk-3.0.js").Gtk.IconInfo | null;
export declare function ensureDirectory(path?: string): void;
export declare function execAsync(cmd: string | string[]): Promise<string>;
export declare function exec(cmd: string): string;
export declare function subprocess(cmd: string | string[], callback: (out: string) => void, onError?: (message?: any, ...optionalParams: any[]) => void, bind?: InstanceType<typeof Gtk.Widget>): import("../types/gtk-types/gio-2.0.js").Gio.Subprocess | null;
