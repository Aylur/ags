import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

const transitions = [
    'none', 'crossfade',
    'slide_right', 'slide_left', 'slide_up', 'slide_down',
    'slide_left_right', 'slide_up_down',
    'over_up', 'over_down', 'over_left', 'over_right',
    'under_up', 'under_down', 'under_left', 'under_right',
    'over_up_down', 'over_down_up', 'over_left_right', 'over_right_left',
] as const;

type Transition = typeof transitions[number]

export interface StackProps extends BaseProps<AgsStack>, Gtk.Stack.ConstructorProperties {
    shown?: string
    items?: [string, Gtk.Widget][]
    transition?: Transition
}

export default class AgsStack extends AgsWidget(Gtk.Stack) {
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

    constructor(props: StackProps) { super(props); }

    add_named(child: Gtk.Widget, name: string): void {
        this.items.push([name, child]);
        super.add_named(child, name);
        this.notify('items');
    }

    get items() {
        if (!Array.isArray(this._get('items')))
            this._set('items', []);

        return this._get('items');
    }

    set items(items: [string, Gtk.Widget][]) {
        this.items
            .filter(([name]) => !items.find(([n]) => n === name))
            .forEach(([, ch]) => ch.destroy());

        // remove any children that weren't destroyed so
        // we can re-add everything without trying to add
        // items multiple times
        this.items
            .filter(([, ch]) => this.get_children().includes(ch))
            .forEach(([, ch]) => this.remove(ch));

        items.forEach(([name, widget]) => {
            widget && super.add_named(widget, name);
        });

        this._set('items', items);
        this.show_all();
    }

    get transition() { return transitions[this.transition_type]; }
    set transition(transition: Transition) {
        if (this.transition === transition)
            return;

        if (!transitions.includes(transition)) {
            console.error('wrong transition value for Stack');
            return;
        }

        this.transition_type = transitions.findIndex(t => t === transition);
        this.notify('transition');
    }

    get shown() { return this.visible_child_name; }
    set shown(name: string | null) {
        if (!this.get_child_by_name(name)) {
            this.visible = false;
            return;
        }

        this.visible = true;
        this.set_visible_child_name(name);
        this.notify('shown');
    }
}
