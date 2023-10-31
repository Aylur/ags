import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

export interface ProgressBarProps extends
    BaseProps<AgsProgressBar>, Gtk.ProgressBar.ConstructorProperties {
    vertical?: boolean
    value?: number
}

export default class AgsProgressBar extends AgsWidget(Gtk.ProgressBar) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsProgressBar',
            Properties: {
                'vertical': Service.pspec('vertical', 'boolean', 'rw'),
                'value': Service.pspec('value', 'float', 'rw'),
            },
        }, this);
    }

    constructor(props: ProgressBarProps = {}) { super(props); }

    get value() { return this.fraction; }
    set value(value: number) {
        if (this.value === value)
            return;

        this.fraction = value;
        this.notify('value');
    }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(vertical: boolean) {
        if (this.vertical === vertical)
            return;

        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;

        this.notify('vertical');
    }
}
