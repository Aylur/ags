import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

// TODO:

export type FixedProps<
    Attr = unknown,
    Self = Fixed<Attr>,
> = BaseProps<Self, Gtk.Fixed.ConstructorProperties, Attr>

export function newFixed<
    Attr = unknown
>(...props: ConstructorParameters<typeof Fixed<Attr>>) {
    return new Fixed(...props);
}

export interface Fixed<Attr> extends Widget<Attr> { }
export class Fixed<Attr> extends Gtk.Fixed {
    static { register(this); }

    constructor(props: FixedProps<Attr> = {}) {
        super(props as Gtk.Fixed.ConstructorProperties);
    }
}

export default Fixed;
