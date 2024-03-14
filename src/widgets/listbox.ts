import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

// TODO:

export type ListBoxProps<
    Attr = unknown,
    Self = ListBox<Attr>,
> = BaseProps<Self, Gtk.ListBox.ConstructorProperties, Attr>

export function newListBox<
    Attr = unknown
>(...props: ConstructorParameters<typeof ListBox<Attr>>) {
    return new ListBox(...props);
}

export interface ListBox<Attr> extends Widget<Attr> { }
export class ListBox<Attr> extends Gtk.ListBox {
    static { register(this); }

    constructor(props: ListBoxProps<Attr> = {}) {
        super(props as Gtk.ListBox.ConstructorProperties);
    }
}

export default ListBox;
