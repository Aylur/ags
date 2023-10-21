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
type Policy = 'automatic' | 'always' | 'never' | 'external';
export interface ScrollableProps extends GtkTypes.ScrolledWindow.ConstructorProperties {
    hscroll?: Policy;
    vscroll?: Policy;
}
export default class AgsScrollable extends Gtk.ScrolledWindow {
    constructor(params?: ScrollableProps);
    get hscroll(): Policy;
    set hscroll(hscroll: Policy);
    get vscroll(): Policy;
    set vscroll(vscroll: Policy);
    policy(): void;
}
export {};
