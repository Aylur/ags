import AgsWidget, { type BaseProps } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type ProgressBarProps = BaseProps<AgsProgressBar, Gtk.ProgressBar.ConstructorProperties & {
    vertical?: boolean
    value?: number
}>

export default class AgsProgressBar extends AgsWidget(Gtk.ProgressBar) {
    static {
        AgsWidget.register(this, {
            properties: {
                'vertical': ['boolean', 'rw'],
                'value': ['float', 'rw'],
            },
        });
    }

    constructor(props: ProgressBarProps = {}) {
        super(props as Gtk.ProgressBar.ConstructorProperties);
    }

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
