import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service/service.js';

const transitions = [
    'none', 'crossfade',
    'slide_right', 'slide_left', 'slide_up', 'slide_down',
    'slide_left_right', 'slide_up_down',
    'over_up', 'over_down', 'over_left', 'over_right',
    'under_up', 'under_down', 'under_left', 'under_right',
    'over_up_down', 'over_down_up', 'over_left_right', 'over_right_left',
];

export default class AgsStack extends Gtk.Stack {
    static {
        GObject.registerClass({
            GTypeName: 'AgsStack',
            Properties: {
                'transition': Service.pspec('transition', 'string', 'rw'),
                'shown': Service.pspec('shown', 'string', 'rw'),
                'items': Service.pspec('items', 'jsobject', 'rw'),
            },
        }, this);
    }

    add_named(child: InstanceType<typeof Gtk.Widget>, name: string): void {
        this.items.push([name, child]);
        super.add_named(child, name);
    }

    get items() {
        // @ts-expect-error
        if (!Array.isArray(this._items))
            // @ts-expect-error
            this._items = [];

        // @ts-expect-error
        return this._items;
    }

    set items(items: [string, InstanceType<typeof Gtk.Widget>][]) {
        this.items
            .filter(([name]) => !items.find(([n]) => n === name))
            .forEach(([, ch]) => ch.destroy());

        // remove any children that weren't destroyed so
        // we can re-add everything without trying to add
        // items multiple times
        this.items
            .filter(([, ch]) => this.get_children().includes(ch))
            .forEach(([, ch]) => this.remove(ch));

        // @ts-expect-error
        this._items = [];
        items.forEach(([name, widget]) => {
            widget && this.add_named(widget, name);
        });

        this.notify('items');
        this.show_all();
    }

    get transition() { return transitions[this.transition_type]; }
    set transition(transition: string) {
        if (typeof transition !== 'string')
            return;

        if (!transitions.includes(transition)) {
            console.error('wrong transition value for Stack');
            return;
        }

        this.transition_type = transitions.findIndex(t => t === transition);
        this.notify('transition');
    }

    get shown() { return this.visible_child_name!; }
    set shown(name: string) {
        if (name === null || !this.get_child_by_name(name)) {
            this.visible = false;
            return;
        }

        if (!name)
            return;

        this.visible = true;
        this.set_visible_child_name(name);
        this.notify('shown');
    }
}
