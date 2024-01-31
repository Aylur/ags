/* eslint-disable max-len */
/**
 * I wish there was a better way to do this, but I couldn't figure out
 * how to write a generic function that could genereate theese
 */
import Gtk from 'gi://Gtk?version=3.0';
import { register, type BaseProps, type Widget } from './widget.js';

export type CalendarProps<Attr> = BaseProps<Calendar<Attr>, Gtk.Calendar.ConstructorProperties, Attr>;
export interface Calendar<Attr> extends Widget<Attr> { }
export class Calendar<Attr> extends Gtk.Calendar {
    static { register(this); }
    constructor(props: BaseProps<Calendar<Attr>, Gtk.Calendar.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type ColorButtonProps<Attr> = BaseProps<ColorButton<Attr>, Gtk.ColorButton.ConstructorProperties, Attr>;
export interface ColorButton<Attr> extends Widget<Attr> { }
export class ColorButton<Attr> extends Gtk.ColorButton {
    static { register(this); }
    constructor(props: BaseProps<ColorButton<Attr>, Gtk.ColorButton.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type DrawingAreaProps<Attr> = BaseProps<DrawingArea<Attr>, Gtk.DrawingArea.ConstructorProperties, Attr>;
export interface DrawingArea<Attr> extends Widget<Attr> { }
export class DrawingArea<Attr> extends Gtk.DrawingArea {
    static { register(this); }
    constructor(props: BaseProps<DrawingArea<Attr>, Gtk.DrawingArea.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type FileChooserButtonProps<Attr> = BaseProps<FileChooserButton<Attr>, Gtk.FileChooserButton.ConstructorProperties, Attr>;
export interface FileChooserButton<Attr> extends Widget<Attr> { }
export class FileChooserButton<Attr> extends Gtk.FileChooserButton {
    static { register(this); }
    constructor(props: BaseProps<FileChooserButton<Attr>, Gtk.FileChooserButton.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type FixedProps<Attr> = BaseProps<Fixed<Attr>, Gtk.Fixed.ConstructorProperties, Attr>;
export interface Fixed<Attr> extends Widget<Attr> { }
export class Fixed<Attr> extends Gtk.Fixed {
    static { register(this); }
    constructor(props: BaseProps<Fixed<Attr>, Gtk.Fixed.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type FlowBoxProps<Attr> = BaseProps<FlowBox<Attr>, Gtk.FlowBox.ConstructorProperties, Attr>;
export interface FlowBox<Attr> extends Widget<Attr> { }
export class FlowBox<Attr> extends Gtk.FlowBox {
    static { register(this); }
    constructor(props: BaseProps<FlowBox<Attr>, Gtk.FlowBox.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type FontButtonProps<Attr> = BaseProps<FontButton<Attr>, Gtk.FontButton.ConstructorProperties, Attr>;
export interface FontButton<Attr> extends Widget<Attr> { }
export class FontButton<Attr> extends Gtk.FontButton {
    static { register(this); }
    constructor(props: BaseProps<FontButton<Attr>, Gtk.FontButton.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type LevelBarProps<Attr> = BaseProps<LevelBar<Attr>, Gtk.LevelBar.ConstructorProperties, Attr>;
export interface LevelBar<Attr> extends Widget<Attr> { }
export class LevelBar<Attr> extends Gtk.LevelBar {
    static { register(this); }
    constructor(props: BaseProps<LevelBar<Attr>, Gtk.LevelBar.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type ListBoxProps<Attr> = BaseProps<ListBox<Attr>, Gtk.ListBox.ConstructorProperties, Attr>;
export interface ListBox<Attr> extends Widget<Attr> { }
export class ListBox<Attr> extends Gtk.ListBox {
    static { register(this); }
    constructor(props: BaseProps<ListBox<Attr>, Gtk.ListBox.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type MenuBarProps<Attr> = BaseProps<MenuBar<Attr>, Gtk.MenuBar.ConstructorProperties, Attr>;
export interface MenuBar<Attr> extends Widget<Attr> { }
export class MenuBar<Attr> extends Gtk.MenuBar {
    static { register(this); }
    constructor(props: BaseProps<MenuBar<Attr>, Gtk.MenuBar.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type SeparatorProps<Attr> = BaseProps<Separator<Attr>, Gtk.Separator.ConstructorProperties, Attr>;
export interface Separator<Attr> extends Widget<Attr> { }
export class Separator<Attr> extends Gtk.Separator {
    static { register(this); }
    constructor(props: BaseProps<Separator<Attr>, Gtk.Separator.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type SpinButtonProps<Attr> = BaseProps<SpinButton<Attr>, Gtk.SpinButton.ConstructorProperties, Attr>;
export interface SpinButton<Attr> extends Widget<Attr> { }
export class SpinButton<Attr> extends Gtk.SpinButton {
    static { register(this); }
    constructor(props: BaseProps<SpinButton<Attr>, Gtk.SpinButton.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type SpinnerProps<Attr> = BaseProps<Spinner<Attr>, Gtk.Spinner.ConstructorProperties, Attr>;
export interface Spinner<Attr> extends Widget<Attr> { }
export class Spinner<Attr> extends Gtk.Spinner {
    static { register(this); }
    constructor(props: BaseProps<Spinner<Attr>, Gtk.Spinner.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
export type SwitchProps<Attr> = BaseProps<Switch<Attr>, Gtk.Switch.ConstructorProperties, Attr>;
export interface Switch<Attr> extends Widget<Attr> { }
export class Switch<Attr> extends Gtk.Switch {
    static { register(this); }
    constructor(props: BaseProps<Switch<Attr>, Gtk.Switch.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ToggleButton<Child, Attr> extends Widget<Attr> { }
export type ToggleButtonProps<Child extends Gtk.Widget, Attr> = BaseProps<ToggleButton<Child, Attr>, Gtk.ToggleButton.ConstructorProperties & { child?: Child }, Attr>;
export class ToggleButton<Child extends Gtk.Widget, Attr> extends Gtk.ToggleButton {
    static { register(this); }
    constructor(props: BaseProps<ToggleButton<Child, Attr>, Gtk.ToggleButton.ConstructorProperties, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;
        super(props as Gtk.Widget.ConstructorProperties);
    }
}
