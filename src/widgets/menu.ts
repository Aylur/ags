import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type MenuEventHandler<Self> = {
    on_popup?: (
        self: Self,
        flipped_rect: any | null,
        final_rect: any | null,
        flipped_x: boolean,
        flipped_y: boolean,
    ) => void | unknown
    on_move_scroll?: (self: Self, scroll_type: Gtk.ScrollType) => void | unknown
}

export type MenuProps<
    MenuItem extends Gtk.MenuItem = Gtk.MenuItem,
    Attr = unknown,
    Self = Menu<MenuItem, Attr>,
> = BaseProps<Self, Gtk.Menu.ConstructorProperties & {
    children?: MenuItem[]
} & MenuEventHandler<Self>, Attr>

export function newMenu<
    MenuItem extends Gtk.MenuItem = Gtk.MenuItem,
    Attr = unknown,
>(...props: ConstructorParameters<typeof Menu<MenuItem, Attr>>) {
    return new Menu(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Menu<MenuItem, Attr> extends Widget<Attr> { }
export class Menu<MenuItem extends Gtk.MenuItem, Attr> extends Gtk.Menu {
    static {
        register(this, {
            properties: {
                'children': ['jsobject', 'rw'],
                'on-popup': ['jsobject', 'rw'],
                'on-move-scroll': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: MenuProps<MenuItem, Attr> = {}, ...children: Gtk.MenuItem[]) {
        if (children.length > 0)
            props.children = children as MenuItem[];

        super(props as Gtk.Menu.ConstructorProperties);

        this.connect('popped-up', (_, ...args) => this.on_popup?.(this, ...args));
        this.connect('move-scroll', (_, ...args) => this.on_move_scroll?.(this, ...args));
    }

    get on_popup() { return this._get('on-popup'); }
    set on_popup(callback: MenuEventHandler<this>['on_popup']) {
        this._set('on-popup', callback);
    }

    get on_move_scroll() { return this._get('on-move-scroll'); }
    set on_move_scroll(callback: MenuEventHandler<this>['on_move_scroll']) {
        this._set('on-move-scroll', callback);
    }

    get children() { return this.get_children() as MenuItem[]; }
    set children(children: MenuItem[]) {
        this.get_children().forEach(ch => ch.destroy());

        if (!children)
            return;

        children.forEach(w => w && this.add(w));

        const visible = this.visible;
        this.show_all();
        this.visible = visible;
    }
}

export default Menu;
