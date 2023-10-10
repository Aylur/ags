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
import AgsBox from './box.js';
export default class AgsCenterBox extends AgsBox {
    set children(children: InstanceType<typeof Gtk.Widget>[] | null);
    get start_widget(): InstanceType<typeof Gtk.Widget> | null;
    set start_widget(child: InstanceType<typeof Gtk.Widget> | null);
    get end_widget(): InstanceType<typeof Gtk.Widget> | null;
    set end_widget(child: InstanceType<typeof Gtk.Widget> | null);
    get center_widget(): InstanceType<typeof Gtk.Widget> | null;
    set center_widget(child: InstanceType<typeof Gtk.Widget> | null);
}
