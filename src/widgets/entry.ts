import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

export type EventHandler = (self: AgsEntry) => void | unknown;
export type EntryProps = BaseProps<AgsEntry, Gtk.Entry.ConstructorProperties & {
    on_accept?: EventHandler
    on_change?: EventHandler
}>

export default class AgsEntry extends AgsWidget(Gtk.Entry) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsEntry',
            Properties: {
                'on-accept': Service.pspec('on-accept', 'jsobject', 'rw'),
                'on-change': Service.pspec('on-change', 'jsobject', 'rw'),
            },
        }, this);
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
