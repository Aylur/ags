import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type ProgressBarProps<
    Attr = unknown,
    Self = ProgressBar<Attr>,
> = BaseProps<Self, Gtk.ProgressBar.ConstructorProperties & {
    vertical?: boolean
    value?: number
}, Attr>

export function newProgressBar<
    Attr = unknown
>(...props: ConstructorParameters<typeof ProgressBar<Attr>>) {
    return new ProgressBar(...props);
}

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
        this.connect('notify::fraction', () => this.notify('value'));
        this.connect('notify::orientation', () => this.notify('vertical'));
    }

    get value() { return this.fraction; }
    set value(value: number) { this.fraction = value; }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(v: boolean) {
        this.orientation = Gtk.Orientation[v ? 'VERTICAL' : 'HORIZONTAL'];
    }
}

export default ProgressBar;
