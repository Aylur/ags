import "./gtk-types/gtk-3.0-ambient";
import "./gtk-types/gdk-3.0-ambient";
import "./gtk-types/cairo-1.0-ambient";
import "./gtk-types/gnomebluetooth-3.0-ambient";
import "./gtk-types/dbusmenugtk3-0.4-ambient";
import "./gtk-types/gobject-2.0-ambient";
import "./gtk-types/nm-1.0-ambient";
import "./gtk-types/soup-3.0-ambient";
import "./gtk-types/gvc-1.0-ambient";
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import type GObjectTypes from '../types/gtk-types/gobject-2.0';
type PspecType = 'jsobject' | 'string' | 'int' | 'float' | 'double' | 'boolean' | 'gobject';
type PspecFlag = 'rw' | 'r' | 'w';
export default class Service extends GObject.Object {
    static pspec(name: string, type?: PspecType, handle?: PspecFlag): GObjectTypes.ParamSpecString | GObjectTypes.ParamSpecInt64 | GObjectTypes.ParamSpecFloat | GObjectTypes.ParamSpecDouble | GObjectTypes.ParamSpecBoolean | GObjectTypes.ParamSpecObject | GObjectTypes.ParamSpecBoxed;
    static register(service: new (...args: any[]) => unknown, signals?: {
        [signal: string]: string[];
    }, properties?: {
        [prop: string]: [type?: PspecType, handle?: PspecFlag];
    }): void;
    connectWidget(widget: InstanceType<typeof Gtk.Widget>, callback: (widget: InstanceType<typeof Gtk.Widget>, ...args: unknown[]) => void, event?: string): void;
    updateProperty(prop: string, value: unknown): void;
    changed(property: string): void;
}
export {};
