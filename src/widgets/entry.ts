import AgsWidget, { type BaseProps } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type EventHandler = (self: AgsEntry) => void | unknown;
export type EntryProps = BaseProps<AgsEntry, Gtk.Entry.ConstructorProperties & {
    on_accept?: EventHandler
    on_change?: EventHandler
}>

export default class AgsEntry extends AgsWidget(Gtk.Entry) {
    static {
        AgsWidget.register(this, {
            properties: {
                'on-accept': ['jsobject', 'rw'],
                'on-change': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: EntryProps = {}) {
        super(props as Gtk.Entry.ConstructorProperties);

        this.connect('activate', () => this.on_accept?.(this));
        this.connect('notify::text', () => this.on_change?.(this));
    }

    get on_accept() { return this._get('on-accept'); }
    set on_accept(callback: EventHandler) {
        this._set('on-accept', callback);
    }

    get on_change() { return this._get('on-change'); }
    set on_change(callback: EventHandler) {
        this._set('on-change', callback);
    }
}
