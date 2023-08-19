import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

export default class AgsProgressBar extends Gtk.ProgressBar {
    static {
        GObject.registerClass({
            GTypeName: 'AgsProgressBar',
            Properties: {
                'vertical': GObject.ParamSpec.boolean(
                    'vertical', 'Vertical', 'Vertical',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    false,
                ),
                'value': GObject.ParamSpec.int(
                    'value', 'Value', 'Same as fraction',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    0, 1, 0,
                ),
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
