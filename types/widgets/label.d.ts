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
interface Props extends GtkTypes.Label.ConstructorProperties {
    justification?: string;
    truncate?: string;
}
export type LabelProps = Props | string | undefined;
export default class AgsLabel extends Gtk.Label {
    constructor(params?: LabelProps);
    get label(): string;
    set label(label: string);
    get truncate(): string;
    set truncate(truncate: string);
    get justification(): string;
    set justification(justify: string);
}
export {};
