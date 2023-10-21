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
import type GtkTypes from "../../types/gtk-types/gtk-3.0";
import Gdk from 'gi://Gdk?version=3.0';
declare const layers: readonly ["background", "bottom", "top", "overlay"];
declare const anchors: readonly ["left", "right", "top", "bottom"];
export interface WindowProps extends Omit<GtkTypes.Window.ConstructorProperties, 'margin'> {
    anchor?: typeof anchors[number][];
    exclusive?: boolean;
    focusable?: boolean;
    layer?: typeof layers[number];
    margin?: number[];
    monitor?: number;
    popup?: boolean;
    visible?: boolean;
}
export default class AgsWindow extends Gtk.Window {
    constructor({ anchor, exclusive, focusable, layer, margin, monitor, popup, visible, ...params }?: WindowProps);
    _monitor: InstanceType<typeof Gdk.Monitor> | null;
    get monitor(): number | null | InstanceType<typeof Gdk.Monitor>;
    set monitor(monitor: number | null | InstanceType<typeof Gdk.Monitor>);
    get exclusive(): boolean;
    set exclusive(exclusive: boolean);
    get layer(): "background" | "bottom" | "top" | "overlay";
    set layer(layer: "background" | "bottom" | "top" | "overlay");
    get anchor(): typeof anchors[number][];
    set anchor(anchor: typeof anchors[number][]);
    get margin(): number[];
    set margin(margin: number[]);
    get popup(): boolean;
    set popup(popup: boolean);
    get focusable(): boolean;
    set focusable(focusable: boolean);
}
export {};
