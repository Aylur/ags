import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import Gtk from 'gi://Gtk?version=3.0';
export default class AgsScrollable extends Gtk.ScrolledWindow {
    constructor(params: object);
    get hscroll(): string;
    set hscroll(hscroll: string);
    get vscroll(): string;
    set vscroll(vscroll: string);
    policy(): void;
}
