import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

type MenuEventHandler = {
    on_popup?: (
        self: AgsMenu,
        flipped_rect: any | null,
        final_rect: any | null,
        flipped_x: boolean,
        flipped_y: boolean,
    ) => void | unknown
    on_move_scroll?: (self: AgsMenu, scroll_type: Gtk.ScrollType) => void | unknown
}

export type MenuProps = BaseProps<AgsMenu, Gtk.Menu.ConstructorProperties & {
    children?: Gtk.Widget[]
} & MenuEventHandler>

export class AgsMenu extends AgsWidget(Gtk.Menu) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsMenu',
            Properties: {
                'children': Service.pspec('children', 'jsobject', 'rw'),
                'on-popup': Service.pspec('on-popup', 'jsobject', 'rw'),
                'on-move-scroll': Service.pspec('on-move-scroll', 'jsobject', 'rw'),
            },
        }, this);
    }

    constructor(props: MenuProps = {}) {
        super(props as Gtk.Menu.ConstructorProperties);

        this.connect('popped-up', (_, ...args) => this.on_popup?.(this, ...args));
        this.connect('move-scroll', (_, ...args) => this.on_move_scroll?.(this, ...args));
    }

    get on_popup() { return this._get('on-popup'); }
    set on_popup(callback: MenuEventHandler['on_popup']) {
        this._set('on-popup', callback);
    }

    get on_move_scroll() { return this._get('on-move-scroll'); }
    set on_move_scroll(callback: MenuEventHandler['on_move_scroll']) {
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

type EventHandler = (self: AgsMenuItem) => boolean | unknown;
export type MenuItemProps = BaseProps<AgsMenuItem, Gtk.MenuItem.ConstructorProperties & {
    on_activate?: EventHandler
    on_select?: EventHandler
    on_deselct?: EventHandler
}>

export class AgsMenuItem extends AgsWidget(Gtk.MenuItem) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsMenuItem',
            Properties: {
                'on-activate': Service.pspec('on-activate', 'jsobject', 'rw'),
                'on-select': Service.pspec('on-select', 'jsobject', 'rw'),
                'on-deselect': Service.pspec('on-deselect', 'jsobject', 'rw'),
            },
        }, this);
    }

    constructor(props: MenuItemProps = {}) {
        super(props as Gtk.MenuItem.ConstructorProperties);

        this.connect('activate', () => this.on_activate?.(this));
        this.connect('select', () => this.on_select?.(this));
        this.connect('deselect', () => this.on_deselect?.(this));
    }

    get on_activate() { return this._get('on-activate'); }
    set on_activate(callback: EventHandler) {
        this._set('on-activate', callback);
    }

    get on_select() { return this._get('on-select'); }
    set on_select(callback: EventHandler) {
        this._set('on-select', callback);
    }

    get on_deselect() { return this._get('on-deselect'); }
    set on_deselect(callback: EventHandler) {
        this._set('on-deselect', callback);
    }
}
