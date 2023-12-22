import AgsWidget, { type BaseProps } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

const TRANSITION = {
    'none': Gtk.StackTransitionType.NONE,
    'crossfade': Gtk.StackTransitionType.CROSSFADE,
    'slide_right': Gtk.StackTransitionType.SLIDE_RIGHT,
    'slide_left': Gtk.StackTransitionType.SLIDE_LEFT,
    'slide_up': Gtk.StackTransitionType.SLIDE_UP,
    'slide_down': Gtk.StackTransitionType.SLIDE_DOWN,
    'slide_left_right': Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
    'slide_up_down': Gtk.StackTransitionType.SLIDE_UP_DOWN,
    'over_up': Gtk.StackTransitionType.OVER_UP,
    'over_down': Gtk.StackTransitionType.OVER_DOWN,
    'over_left': Gtk.StackTransitionType.OVER_LEFT,
    'over_right': Gtk.StackTransitionType.OVER_RIGHT,
    'under_up': Gtk.StackTransitionType.UNDER_UP,
    'under_down': Gtk.StackTransitionType.UNDER_DOWN,
    'under_left': Gtk.StackTransitionType.UNDER_LEFT,
    'under_right': Gtk.StackTransitionType.UNDER_RIGHT,
    'over_up_down': Gtk.StackTransitionType.OVER_UP_DOWN,
    'over_down_up': Gtk.StackTransitionType.OVER_DOWN_UP,
    'over_left_right': Gtk.StackTransitionType.OVER_LEFT_RIGHT,
    'over_right_left': Gtk.StackTransitionType.OVER_RIGHT_LEFT,
} as const;

export type Transition = keyof typeof TRANSITION;

export type StackProps = BaseProps<AgsStack, Gtk.Stack.ConstructorProperties & {
    shown?: string
    items?: [string, Gtk.Widget][]
    transition?: Transition
}>

export default class AgsStack extends AgsWidget(Gtk.Stack) {
    static {
        AgsWidget.register(this, {
            properties: {
                'transition': ['string', 'rw'],
                'shown': ['string', 'rw'],
                'items': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: StackProps = {}) {
        super(props as Gtk.Stack.ConstructorProperties);
    }

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

    get transition() {
        return Object.keys(TRANSITION).find(key => {
            return TRANSITION[key as Transition] === this.transition_type;
        }) as Transition;
    }

    set transition(transition: Transition) {
        if (this.transition === transition)
            return;

        if (!Object.keys(TRANSITION).includes(transition)) {
            console.error(Error(
                `transition on Stack has to be one of ${Object.keys(TRANSITION)}, ` +
                `but it is ${transition}`,
            ));
            return;
        }

        this.transition_type = TRANSITION[transition];
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
