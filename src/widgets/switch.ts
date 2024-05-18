import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type Event<Self> = (self: Self) => void | boolean

export type SwitchProps<
    Attr = unknown,
    Self = Switch<Attr>,
> = BaseProps<Self, Gtk.Switch.ConstructorProperties & {
    on_activate?: Event<Self>
}, Attr>;

export function newSwitch<
    Attr = unknown
>(...props: ConstructorParameters<typeof Switch<Attr>>) {
    return new Switch(...props);
}

export interface Switch<Attr> extends Widget<Attr> { }
export class Switch<Attr> extends Gtk.Switch {
    static {
        register(this, {
            properties: {
                'on-activate': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: SwitchProps<Attr> = {}) {
        super(props as Gtk.Switch.ConstructorProperties);
        this.connect('notify::active', this.on_activate.bind(this));
    }

    get on_activate() { return this._get('on-activate') || (() => false); }
    set on_activate(callback: Event<this>) { this._set('on-activate', callback); }
}

export default Switch;
