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
interface Context {
    setSourceRGBA: (r: number, g: number, b: number, a: number) => void;
    arc: (x: number, y: number, r: number, a1: number, a2: number) => void;
    setLineWidth: (w: number) => void;
    lineTo: (x: number, y: number) => void;
    stroke: () => void;
    fill: () => void;
    $dispose: () => void;
}
export default class AgsCircularProgress extends Gtk.Bin {
    get rounded(): boolean;
    set rounded(r: boolean);
    get inverted(): boolean;
    set inverted(c: boolean);
    get start_at(): number;
    set start_at(value: number);
    get value(): number;
    set value(value: number);
    vfunc_get_preferred_height(): [number, number];
    vfunc_get_preferred_width(): [number, number];
    private _toRadian;
    vfunc_draw(cr: Context): boolean;
}
export {};
