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
export default class AgsStack extends Gtk.Stack {
    add_named(child: InstanceType<typeof Gtk.Widget>, name: string): void;
    get items(): [string, InstanceType<typeof Gtk.Widget>][];
    set items(items: [string, InstanceType<typeof Gtk.Widget>][]);
    get transition(): string;
    set transition(transition: string);
    get shown(): string;
    set shown(name: string);
}
