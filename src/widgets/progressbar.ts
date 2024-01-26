import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type ProgressBarProps<Attr> =
    BaseProps<ProgressBar<Attr>, Gtk.ProgressBar.ConstructorProperties & {
        vertical?: boolean
        value?: number
    }, Attr>

export interface ProgressBar<Attr> extends Widget<Attr> { }
export class ProgressBar<Attr> extends Gtk.ProgressBar {
    static {
        register(this, {
            properties: {
                'vertical': ['boolean', 'rw'],
                'value': ['float', 'rw'],
            },
        });
    }

    constructor(props: ProgressBarProps<Attr> = {}) {
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

export default ProgressBar;
