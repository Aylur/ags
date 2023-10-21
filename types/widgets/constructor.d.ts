import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/soup-3.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';
export type Command = string | ((...args: unknown[]) => boolean);
export interface CommonParams<T extends InstanceType<typeof Gtk.Widget>> {
    className?: string;
    style?: string;
    css?: string;
    halign?: 'start' | 'center' | 'end' | 'fill';
    valign?: 'start' | 'center' | 'end' | 'fill';
    connections?: ([
        string,
        (widget: T) => unknown
    ] | [
        number,
        (widget: T) => unknown
    ] | [
        InstanceType<typeof GObject.Object>,
        (widget: T, ...args: unknown[]) => unknown,
        string
    ])[];
    properties?: [prop: string, value: unknown][];
    binds?: [
        prop: string,
        obj: InstanceType<typeof GObject.Object>,
        objProp?: string,
        transform?: (value: unknown) => unknown
    ][];
    setup?: (widget: T) => void;
}
export declare function constructor<Output extends InstanceType<typeof Gtk.Widget>, Params extends CommonParams<Output> | ConstructorParameters<Class>[0], Class extends new (arg: Omit<Params, keyof CommonParams<Output>>) => InstanceType<Class> & Output>(ctor: Class, params: Params): InstanceType<Class>;
