import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/soup-3.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
type Ctor = new (...a: any[]) => object;
export type GType<T = unknown> = {
    __type__(arg: never): T;
    name: string;
};
type PspecType = 'jsobject' | 'string' | 'int' | 'float' | 'boolean' | 'double';
type PspecFlag = 'rw' | 'r' | 'w';
export default class Service extends GObject.Object {
    static ensureInstance(api: {
        _instance: Service;
    }, service: {
        new (): Service;
    }): void;
    static pspec(name: string, type?: PspecType, handle?: PspecFlag): import("../../types/gtk-types/gobject-2.0.js").GObject.ParamSpecString | import("../../types/gtk-types/gobject-2.0.js").GObject.ParamSpecInt64 | import("../../types/gtk-types/gobject-2.0.js").GObject.ParamSpecFloat | import("../../types/gtk-types/gobject-2.0.js").GObject.ParamSpecDouble | import("../../types/gtk-types/gobject-2.0.js").GObject.ParamSpecBoolean | import("../../types/gtk-types/gobject-2.0.js").GObject.ParamSpecBoxed;
    static register(service: Ctor, signals?: {
        [signal: string]: string[];
    }, properties?: {
        [prop: string]: [type?: PspecType, handle?: PspecFlag];
    }): void;
    connectWidget(widget: InstanceType<typeof Gtk.Widget>, callback: (widget: InstanceType<typeof Gtk.Widget>, ...args: unknown[]) => void, event?: string): void;
    updateProperty(prop: string, value: unknown): void;
    changed(property: string): void;
}
export {};
