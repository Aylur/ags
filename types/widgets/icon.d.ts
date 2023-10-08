import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import Gtk from 'gi://Gtk?version=3.0';
import GdkPixbuf from 'gi://GdkPixbuf';
import type Cario from 'gi://cairo';
export default class AgsIcon extends Gtk.Image {
    constructor(params: object | string | InstanceType<typeof GdkPixbuf.Pixbuf>);
    _size: number;
    _previousSize: number;
    get size(): number;
    set size(size: number);
    _type: 'file' | 'named' | 'pixbuf';
    _icon: string | InstanceType<typeof GdkPixbuf.Pixbuf>;
    get icon(): string | InstanceType<typeof GdkPixbuf.Pixbuf>;
    set icon(icon: string | InstanceType<typeof GdkPixbuf.Pixbuf>);
    vfunc_draw(cr: InstanceType<typeof Cario.Context>): boolean;
}
