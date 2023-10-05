import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service/service.js';

export default class AgsProgressBar extends Gtk.ProgressBar {
    static {
        GObject.registerClass({
            GTypeName: 'AgsProgressBar',
            Properties: {
                'vertical': Service.pspec('vertical', 'boolean', 'rw'),
                'value': Service.pspec('value', 'float', 'rw'),
            },
        }, this);
    }

    get value() { return this.fraction; }
    set value(value: number) {
        this.fraction = value;
        this.notify('value');
    }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(vertical) {
        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;
    }
}
