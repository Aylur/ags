import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type EventHandler<Self> = (self: Self) => void | unknown;

export type EntryProps<
    Attr = unknown,
    Self = Entry<Attr>,
> = BaseProps<Self, Gtk.Entry.ConstructorProperties & {
    on_accept?: EventHandler<Self>
    on_change?: EventHandler<Self>
}, Attr>

export function newEntry<
    Attr = unknown
>(...props: ConstructorParameters<typeof Entry<Attr>>) {
    return new Entry(...props);
}

export interface Entry<Attr> extends Widget<Attr> { }
export class Entry<Attr> extends Gtk.Entry {
    static {
        register(this, {
            properties: {
                'on-accept': ['jsobject', 'rw'],
                'on-change': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: EntryProps<Attr> = {}) {
        super(props as Gtk.Entry.ConstructorProperties);

        this.connect('activate', () => this.on_accept?.(this));
        this.connect('notify::text', () => this.on_change?.(this));
    }

    get on_accept() { return this._get('on-accept'); }
    set on_accept(callback: EventHandler<this>) {
        this._set('on-accept', callback);
    }

    get on_change() { return this._get('on-change'); }
    set on_change(callback: EventHandler<this>) {
        this._set('on-change', callback);
    }
}

export default Entry;
