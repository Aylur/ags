import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { runCmd } from '../utils.js';

export class Menu extends Gtk.Menu {
    static {
        GObject.registerClass({ GTypeName: 'AgsMenu' }, this);
    }

    onPopup: string | ((...args: any[]) => boolean);
    onMoveScroll: string | ((...args: any[]) => boolean);

    constructor({
        children,
        onPopup = '',
        onMoveScroll = '',
        ...rest
    }: { [key: string]: any }) {
        super(rest);

        if (children)
            this.children = children;

        this.onPopup = onPopup;
        this.onMoveScroll = onMoveScroll;

        this.connect('popped-up', (...args) => runCmd(this.onPopup, ...args));
        this.connect('move-scroll', (...args) => runCmd(this.onMoveScroll, ...args));
    }

    get children() { return this.get_children(); }
    set children(children: Gtk.Widget[] | null) {
        this.get_children().forEach(ch => ch.destroy());

        if (!children)
            return;

        children.forEach(w => {
            if (w)
                this.add(w);
        });

        const visible = this.visible;
        this.show_all();
        this.visible = visible;
    }
}

export class MenuItem extends Gtk.MenuItem {
    static {
        GObject.registerClass({ GTypeName: 'AgsMenuItem' }, this);
    }

    onActivate: string | ((...args: any[]) => boolean);
    onSelect: string | ((...args: any[]) => boolean);
    onDeselect: string | ((...args: any[]) => boolean);

    constructor({
        onActivate = '',
        onSelect = '',
        onDeselect = '',
        ...rest
    }: { [key: string]: any }) {
        super(rest);

        this.onActivate = onActivate;
        this.onSelect = onSelect;
        this.onDeselect = onDeselect;

        this.connect('activate', (...args) => runCmd(this.onActivate, ...args));
        this.connect('select', (...args) => runCmd(this.onSelect, ...args));
        this.connect('deselect', (...args) => runCmd(this.onDeselect, ...args));
    }

    // @ts-ignore
    get child() { return this.get_child(); }
    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget)
            widget.destroy();

        if (child)
            this.add(child);
    }
}
