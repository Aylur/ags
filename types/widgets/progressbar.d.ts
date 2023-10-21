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
export interface ProgressBarProps extends GtkTypes.ProgressBar.ConstructorProperties {
    vertical?: boolean;
    value?: number;
}
export default class AgsProgressBar extends Gtk.ProgressBar {
    get value(): number;
    set value(value: number);
    get vertical(): boolean;
    set vertical(vertical: boolean);
}
