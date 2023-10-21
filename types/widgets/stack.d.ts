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
export interface StackProps extends GtkTypes.Stack.ConstructorProperties {
    shown?: string;
    items?: [string, GtkTypes.Widget][];
    transition?: 'none' | 'crossfade' | 'slide_right' | 'slide_left' | 'slide_up' | 'slide_down' | 'slide_left_right' | 'slide_up_down' | 'over_up' | 'over_down' | 'over_left' | 'over_right' | 'under_up' | 'under_down' | 'under_left' | 'under_right' | 'over_up_down' | 'over_down_up' | 'over_left_right' | 'over_right_left';
}
export default class AgsStack extends Gtk.Stack {
    add_named(child: InstanceType<typeof Gtk.Widget>, name: string): void;
    get items(): [string, InstanceType<typeof Gtk.Widget>][];
    set items(items: [string, InstanceType<typeof Gtk.Widget>][]);
    get transition(): string;
    set transition(transition: string);
    get shown(): string | null;
    set shown(name: string | null);
}
