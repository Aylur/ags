import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

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
                'transition': GObject.ParamSpec.string(
                    'transition', 'Transition', 'Transition',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    'none',
                ),
                'shown': GObject.ParamSpec.string(
                    'shown', 'Shown', 'Shown',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    '',
                ),
            },
        }, this);
    }

    constructor({ items = [], ...params }: { [key: string]: any } = {}) {
        super(params);
        this.items = items;
    }

    add_named(child: Gtk.Widget, name: string): void {
        this._items.push([name, child]);
        super.add_named(child, name);
    }

    _items: [string, Gtk.Widget][] = [];
    get items() { return this._items; }
    set items(items: [string, Gtk.Widget][]) {
        this._items
            .filter(([name]) => !items.find(([n]) => n === name))
            .forEach(([, ch]) => ch.destroy());

        // remove any children that weren't destroyed so
        // we can re-add everything without trying to add
        // items multiple times
        this._items
            .filter(([, ch]) => this.get_children().includes(ch))
            .forEach(([, ch]) => this.remove(ch));

        this._items = [];
        items.forEach(([name, widget]) => {
            widget && this.add_named(widget, name);
        });
        this.show_all();
    }

    get transition() { return transitions[this.transitionType]; }
    set transition(transition: string) {
        if (typeof transition !== 'string')
            return;

        if (!transitions.includes(transition)) {
            console.error('wrong transition value for Stack');
            return;
        }

        // @ts-ignore
        this.transitionType = Gtk.StackTransitionType[transition.toUpperCase()];
    }

    get shown() { return this.visible_child_name; }
    set shown(name: string) {
        if (name === null || !this.get_child_by_name(name)) {
            this.visible = false;
            return;
        }

        if (!name)
            return;

        this.visible = true;
        this.set_visible_child_name(name);
    }
}
