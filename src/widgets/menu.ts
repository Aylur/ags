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

export type MenuProps<Attr = unknown, Self = Menu<Attr>> =
    BaseProps<Self, Gtk.Menu.ConstructorProperties & {
        children?: Gtk.Widget[]
    } & MenuEventHandler<Self>, Attr>

export interface Menu<Attr> extends Widget<Attr> { }
export class Menu<Attr> extends Gtk.Menu {
    static {
        register(this, {
            properties: {
                'children': ['jsobject', 'rw'],
                'on-popup': ['jsobject', 'rw'],
                'on-move-scroll': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: MenuProps<Attr> = {}) {
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

    get children() { return this.get_children(); }
    set children(children: Gtk.Widget[]) {
        this.get_children().forEach(ch => ch.destroy());

        if (!children)
            return;

        children.forEach(w => w && this.add(w));

        const visible = this.visible;
        this.show_all();
        this.visible = visible;
    }
}

type EventHandler<Self> = (self: Self) => boolean | unknown;
export type MenuItemProps<Attr = unknown, Self = MenuItem<Attr>> =
    BaseProps<MenuItem<Attr>, Gtk.MenuItem.ConstructorProperties & {
        on_activate?: EventHandler<Self>
        on_select?: EventHandler<Self>
        on_deselct?: EventHandler<Self>
    }, Attr>

export interface MenuItem<Attr> extends Widget<Attr> { }
export class MenuItem<Attr> extends Gtk.MenuItem {
    static {
        register(this, {
            properties: {
                'on-activate': ['jsobject', 'rw'],
                'on-select': ['jsobject', 'rw'],
                'on-deselect': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: MenuItemProps<Attr> = {}) {
        super(props as Gtk.MenuItem.ConstructorProperties);

        this.connect('activate', () => this.on_activate?.(this));
        this.connect('select', () => this.on_select?.(this));
        this.connect('deselect', () => this.on_deselect?.(this));
    }

    get on_activate() { return this._get('on-activate'); }
    set on_activate(callback: EventHandler<this>) {
        this._set('on-activate', callback);
    }

    get on_select() { return this._get('on-select'); }
    set on_select(callback: EventHandler<this>) {
        this._set('on-select', callback);
    }

    get on_deselect() { return this._get('on-deselect'); }
    set on_deselect(callback: EventHandler<this>) {
        this._set('on-deselect', callback);
    }
}

export default Menu;
