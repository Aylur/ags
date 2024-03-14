import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type Event<Self> = (self: Self) => void | boolean

export type ToggleButtonProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = ToggleButton<Child, Attr>,
> = BaseProps<Self, Gtk.ToggleButton.ConstructorProperties & {
    child?: Child
    on_toggled?: Event<Self>
}, Attr>;

export function newToggleButton<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof ToggleButton<Child, Attr>>) {
    return new ToggleButton(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ToggleButton<Child, Attr> extends Widget<Attr> { }
export class ToggleButton<Child extends Gtk.Widget, Attr> extends Gtk.ToggleButton {
    static {
        register(this, {
            properties: {
                'on-toggled': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: ToggleButtonProps<Child, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;

        super(props as Gtk.ToggleButton.ConstructorProperties);
        this.connect('toggled', this.on_toggled.bind(this));
    }

    get child() { return super.child as Child; }
    set child(child: Child) { super.child = child; }

    get on_toggled() { return this._get('on-toggled') || (() => false); }
    set on_toggled(callback: Event<this>) { this._set('on-toggled', callback); }
}
