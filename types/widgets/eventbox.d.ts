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
import GtkTypes from "../../types/gtk-types/gtk-3.0";
import { type Command } from './widget.js';
export interface EventBoxProps extends GtkTypes.EventBox.ConstructorProperties {
    onPrimaryClick?: Command;
    onSecondaryClick?: Command;
    onMiddleClick?: Command;
    onPrimaryClickRelease?: Command;
    onSecondaryClickRelease?: Command;
    onMiddleClickRelease?: Command;
    onHover?: Command;
    onHoverLost?: Command;
    onScrollUp?: Command;
    onScrollDown?: Command;
}
export default class AgsEventBox extends Gtk.EventBox {
    onPrimaryClick: Command;
    onSecondaryClick: Command;
    onMiddleClick: Command;
    onPrimaryClickRelease: Command;
    onSecondaryClickRelease: Command;
    onMiddleClickRelease: Command;
    onHover: Command;
    onHoverLost: Command;
    onScrollUp: Command;
    onScrollDown: Command;
    constructor({ onPrimaryClick, onSecondaryClick, onMiddleClick, onPrimaryClickRelease, onSecondaryClickRelease, onMiddleClickRelease, onHover, onHoverLost, onScrollUp, onScrollDown, ...params }?: EventBoxProps);
}
