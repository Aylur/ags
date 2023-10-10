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
import type Gdk from 'gi://Gdk?version=3.0';
import { Command } from './constructor.js';
export interface Params {
    onChange?: Command;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
}
export default class AgsSlider extends Gtk.Scale {
    onChange: Command;
    constructor({ onChange, value, min, max, step, ...rest }?: Params);
    get value(): number;
    set value(value: number);
    get min(): number;
    set min(min: number);
    get max(): number;
    set max(max: number);
    get step(): number;
    set step(step: number);
    get dragging(): boolean;
    set dragging(dragging: boolean);
    get vertical(): boolean;
    set vertical(vertical: boolean);
    vfunc_button_release_event(event: InstanceType<typeof Gdk.EventButton>): boolean;
    vfunc_button_press_event(event: InstanceType<typeof Gdk.EventButton>): boolean;
    vfunc_key_press_event(event: InstanceType<typeof Gdk.EventKey>): boolean;
    vfunc_key_release_event(event: InstanceType<typeof Gdk.EventKey>): boolean;
    vfunc_scroll_event(event: InstanceType<typeof Gdk.EventScroll>): boolean;
}
