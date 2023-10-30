import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { runCmd } from '../utils.js';
import { type Command } from './widget.js';

export interface MenuProps extends BaseProps<AgsMenu>, Gtk.Menu.ConstructorProperties {
    children?: Gtk.Widget[]
    onPopup?: Command
    onMoveScroll?: Command
}

export class AgsMenu extends AgsWidget(Gtk.Menu) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsMenu',
        }, this);
    }

    onPopup: Command;
    onMoveScroll: Command;

    constructor({
        children,
        onPopup = '',
        onMoveScroll = '',
        ...rest
    }: MenuProps = {}) {
        super(rest);

        if (children)
            this.children = children;

        this.onPopup = onPopup;
        this.onMoveScroll = onMoveScroll;

        this.connect('popped-up', (...args) =>
            runCmd(this.onPopup, ...args));

        this.connect('move-scroll', (...args) =>
            runCmd(this.onMoveScroll, ...args));
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

export interface MenuItemProps extends BaseProps<AgsMenuItem>, Gtk.Menu.ConstructorProperties {
    onActivate?: Command
    onSelect?: Command
    onDeselect?: Command
}

export class AgsMenuItem extends Gtk.MenuItem {
    static {
        GObject.registerClass({
            GTypeName: 'AgsMenuItem',
        }, this);
    }

    onActivate: Command;
    onSelect: Command;
    onDeselect: Command;

    constructor({
        onActivate = '',
        onSelect = '',
        onDeselect = '',
        ...rest
    }: MenuItemProps = {}) {
        super(rest);

        this.onActivate = onActivate;
        this.onSelect = onSelect;
        this.onDeselect = onDeselect;

        this.connect('activate', (...args) => runCmd(this.onActivate, ...args));
        this.connect('select', (...args) => runCmd(this.onSelect, ...args));
        this.connect('deselect', (...args) => runCmd(this.onDeselect, ...args));
    }
}
