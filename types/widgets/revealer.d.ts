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
export interface RevealerProps extends GtkTypes.Revealer.ConstructorProperties {
    transitions?: 'none' | 'crossfade' | 'slide_right' | 'slide_left' | 'slide_up' | 'slide_down';
}
export default class AgsRevealer extends Gtk.Revealer {
    get transition(): string;
    set transition(transition: string);
}
