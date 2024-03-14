import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type SpinnerProps<
    Attr = unknown
> = BaseProps<Spinner<Attr>, Gtk.Spinner.ConstructorProperties, Attr>;

export function newSpinner<
    Attr = unknown
>(...props: ConstructorParameters<typeof Spinner<Attr>>) {
    return new Spinner(...props);
}

export interface Spinner<Attr> extends Widget<Attr> { }
export class Spinner<Attr> extends Gtk.Spinner {
    static { register(this); }

    constructor(props: BaseProps<Spinner<Attr>, Gtk.Spinner.ConstructorProperties, Attr> = {}) {
        super(props as Gtk.Widget.ConstructorProperties);
        this.start();
        this.connect('notify::visible', ({ visible }) => {
            visible ? this.start() : this.stop();
        });
    }
}

export default Spinner;
