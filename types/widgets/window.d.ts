import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
export interface Params {
    anchor?: string[] | string;
    exclusive?: boolean;
    focusable?: boolean;
    layer?: string;
    margin?: number[] | number;
    monitor?: null | InstanceType<typeof Gdk.Monitor> | number;
    popup?: boolean;
    visible?: null | boolean;
}
export default class AgsWindow extends Gtk.Window {
    constructor({ anchor, exclusive, focusable, layer, margin, monitor, popup, visible, ...params }?: Params);
    _monitor: InstanceType<typeof Gdk.Monitor> | null;
    get monitor(): number | null | InstanceType<typeof Gdk.Monitor>;
    set monitor(monitor: number | null | InstanceType<typeof Gdk.Monitor>);
    _exclusive: boolean;
    get exclusive(): boolean;
    set exclusive(exclusive: boolean);
    _layer: string;
    get layer(): string;
    set layer(layer: string);
    _anchor: string[];
    get anchor(): string[] | string;
    set anchor(anchor: string[] | string);
    _margin: number[] | number;
    get margin(): number[] | number;
    set margin(margin: number[] | number);
    _popup: number;
    get popup(): boolean;
    set popup(popup: boolean);
    get focusable(): boolean;
    set focusable(focusable: boolean);
}
