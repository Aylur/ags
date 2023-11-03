import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

export interface EntryProps extends BaseProps<AgsEntry>, Gtk.Entry.ConstructorProperties {
    on_accept?: (self: AgsEntry) => void | unknown
    on_change?: (self: AgsEntry) => void | unknown
}

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
        super(props);

        this.connect('activate', () => this.on_accept?.(this));
        this.connect('notify::text', () => this.on_change?.(this));
    }

    get on_accept() { return this._get('on-accept'); }
    set on_accept(callback: EntryProps['on_accept']) {
        this._set('on-accept', callback);
    }

    get on_change() { return this._get('on-change'); }
    set on_change(callback: EntryProps['on_change']) {
        this._set('on-change', callback);
    }
}
