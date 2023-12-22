import AgsWidget, { type BaseProps } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type BoxProps = BaseProps<AgsBox, Gtk.Box.ConstructorProperties & {
    children?: Gtk.Widget[]
    vertical?: boolean
}>;

export default class AgsBox extends AgsWidget(Gtk.Box) {
    static {
        AgsWidget.register(this, {
            properties: {
                'vertical': ['boolean', 'rw'],
                'children': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: BoxProps = {}) {
        super(props as Gtk.Box.ConstructorProperties);
    }

    get children() { return this.get_children(); }
    set children(children: Gtk.Widget[]) {
        const newChildren = children || [];

        this.get_children()
            .filter(ch => !newChildren?.includes(ch))
            .forEach(ch => ch.destroy());

        // remove any children that weren't destroyed so
        // we can re-add everything in the correct new order
        this.get_children()
            .forEach(ch => this.remove(ch));

        if (!children)
            return;

        children.forEach(w => w && this.add(w));
        this.notify('children');
        this.show_all();
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
