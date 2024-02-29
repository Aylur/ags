import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type Event<Self> = (self: Self) => void | boolean

export type SpinButtonProps<
    Attr = unknown,
    Self = SpinButton<Attr>,
> = BaseProps<Self, Gtk.SpinButton.ConstructorProperties & {
    on_value_changed?: Event<Self>
}, Attr>;

export function newSpinButton<
    Attr = unknown,
>(...props: ConstructorParameters<typeof SpinButton<Attr>>) {
    return new SpinButton(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SpinButton<Attr> extends Widget<Attr> { }
export class SpinButton<Attr> extends Gtk.SpinButton {
    static {
        register(this, {
            properties: {
                'on-value-changed': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: SpinButtonProps<Attr> = {}) {
        super(props as Gtk.SpinButton.ConstructorProperties);
        this.connect('value-changed', this.on_value_changed.bind(this));
    }

    get on_value_changed() { return this._get('on-value-changed') || (() => false); }
    set on_value_changed(callback: Event<this>) { this._set('on-value-changed', callback); }
}

export default SpinButton;
