import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

export default class AgsBox extends Gtk.Box {
    static {
        GObject.registerClass({
            GTypeName: 'AgsBox',
            Properties: {
                'vertical': GObject.ParamSpec.boolean(
                    'vertical', 'Vertical', 'Vertical',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    false,
                ),
            },
        }, this);
    }

    constructor({ children, ...rest }: { children?: Gtk.Widget[] | null }) {
        super(rest);

        if (children)
            this.children = children;
    }

    get children() { return this.get_children(); }
    set children(children: Gtk.Widget[] | null) {
        this.get_children().forEach(ch => ch.destroy());

        if (!children)
            return;

        children.forEach(w => w && this.add(w));
        this.show_all();
    }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(vertical) {
        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;
    }
}
