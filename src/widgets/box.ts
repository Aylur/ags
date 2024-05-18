import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type BoxProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = Box<Child, Attr>
> = BaseProps<Self, Gtk.Box.ConstructorProperties & {
    child?: Child
    children?: Child[]
    vertical?: boolean
}, Attr>;

export function newBox<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown
>(...props: ConstructorParameters<typeof Box<Child, Attr>>) {
    return new Box(...props);
}

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

    constructor(propsOrChildren: BoxProps<Child, Attr> | Child[] = {}, ...children: Gtk.Widget[]) {
        const props = Array.isArray(propsOrChildren) ? {} : propsOrChildren;

        if (Array.isArray(propsOrChildren))
            props.children = propsOrChildren;

        else if (children.length > 0)
            props.children = children as Child[];

        super(props as Gtk.Box.ConstructorProperties);
        this.connect('notify::orientation', () => this.notify('vertical'));
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
    set vertical(v: boolean) {
        this.orientation = Gtk.Orientation[v ? 'VERTICAL' : 'HORIZONTAL'];
    }
}

export default Box;
