import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GtkTypes from "../../types/gtk-types/gtk-3.0"
import { runCmd } from '../utils.js';
import { type Command } from './widget.js';

export interface MenuProps extends GtkTypes.Menu.ConstructorProperties {
    children?: GtkTypes.Widget[]
    onPopup?: Command
    onMoveScroll?: Command
}

export class AgsMenu extends Gtk.Menu {
    static { GObject.registerClass(this); }

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
    set children(children: InstanceType<typeof Gtk.Widget>[] | null) {
        this.get_children().forEach(ch => ch.destroy());

        if (!children)
            return;

        children.forEach(w => w && this.add(w));

        const visible = this.visible;
        this.show_all();
        this.visible = visible;
    }
}

export interface MenuItemProps extends GtkTypes.Menu.ConstructorProperties {
    onActivate?: Command
    onSelect?: Command
    onDeselect?: Command
}

export class AgsMenuItem extends Gtk.MenuItem {
    static { GObject.registerClass(this); }

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
