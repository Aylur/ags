import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

// TODO:

export type FlowBoxProps<
    Attr = unknown,
    Self = FlowBox<Attr>,
> = BaseProps<Self, Gtk.FlowBox.ConstructorProperties, Attr>

export function newFlowBox<
    Attr = unknown
>(...props: ConstructorParameters<typeof FlowBox<Attr>>) {
    return new FlowBox(...props);
}

export interface FlowBox<Attr> extends Widget<Attr> { }
export class FlowBox<Attr> extends Gtk.FlowBox {
    static { register(this); }

    constructor(props: FlowBoxProps<Attr> = {}) {
        super(props as Gtk.FlowBox.ConstructorProperties);
    }
}

export default FlowBox;
