import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type BoxProps<
    Child extends Gtk.Widget,
    Attr = unknown,
> = BaseProps<Box<Child, Attr>, Gtk.Box.ConstructorProperties & {
    child?: Child
    children?: Child[]
    vertical?: boolean
}, Attr>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Box<Child, Attr> extends Widget<Attr> { }
export class Box<Child extends Gtk.Widget, Attr> extends Gtk.Box {
    static {
        register(this, {
            properties: {
                'vertical': ['boolean', 'rw'],
                'children': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: BoxProps<Child, Attr> = {}) {
        super(props as Gtk.Box.ConstructorProperties);
    }

    get child() { return this.children[0] as Child; }
    set child(child: Child) { this.children = [child]; }

    get children() { return this.get_children() as Child[]; }
    set children(children: Child[]) {
        const newChildren = children || [];

        this.get_children()
            .filter(ch => !newChildren?.includes(ch as Child))
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

export default Box;
