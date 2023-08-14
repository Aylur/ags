import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { separateCommon, parseCommon, CommonParams } from './shared.js';

interface Params extends CommonParams {
    children?: Gtk.Widget[]
    [key: string]: any
}

export class Box extends Gtk.Box {
    static {
        GObject.registerClass({
            GTypeName: 'AgsBox',
            Properties: {
                'vertical': GObject.ParamSpec.boolean(
                    'vertical', 'Vertical', 'Vertical',
                    GObject.ParamFlags.READWRITE,
                    false,
                ),
            },
        }, this);
    }

    constructor({ children, ...params }: Params = {}) {
        const [common, rest] = separateCommon(params);
        super(rest);
        parseCommon(this, common);

        if (children)
            this.children = children;
    }

    set children(children: Gtk.Widget[] | null) {
        this.get_children().forEach(ch => ch.destroy());

        if (!children)
            return;

        children.forEach(w => {
            if (w)
                this.add(w);
        });
        this.show_all();
    }

    get children() {
        return this.get_children();
    }

    get vertical() {
        return this.orientation === Gtk.Orientation.VERTICAL;
    }

    set vertical(vertical) {
        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;
    }
}

export default (params: object) => new Box(params);
