import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

// TODO:

export type MenuBarProps<
    Attr = unknown,
    Self = MenuBar<Attr>,
> = BaseProps<Self, Gtk.MenuBar.ConstructorProperties, Attr>

export function newMenuBar<
    Attr = unknown
>(...props: ConstructorParameters<typeof MenuBar<Attr>>) {
    return new MenuBar(...props);
}

export interface MenuBar<Attr> extends Widget<Attr> { }
export class MenuBar<Attr> extends Gtk.MenuBar {
    static { register(this); }

    constructor(props: MenuBarProps<Attr> = {}) {
        super(props as Gtk.MenuBar.ConstructorProperties);
    }
}

export default MenuBar;
