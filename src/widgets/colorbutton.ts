import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type Event<Self> = (self: Self) => void | boolean

export type ColorButtonProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = ColorButton<Child, Attr>,
> = BaseProps<Self, Gtk.ColorButton.ConstructorProperties & {
    child?: Child
    on_color_set?: Event<Self>
}, Attr>;

export function newColorButton<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof ColorButton<Child, Attr>>) {
    return new ColorButton(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ColorButton<Child, Attr> extends Widget<Attr> { }
export class ColorButton<Child extends Gtk.Widget, Attr> extends Gtk.ColorButton {
    static {
        register(this, {
            properties: {
                'on-color-set': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: ColorButtonProps<Child, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;

        super(props as Gtk.ColorButton.ConstructorProperties);
        this.connect('color-set', this.on_color_set.bind(this));
    }

    get child() { return super.child as Child; }
    set child(child: Child) { super.child = child; }

    get on_color_set() { return this._get('on-color-set') || (() => false); }
    set on_color_set(callback: Event<this>) { this._set('on-color-set', callback); }
}

export default ColorButton;
