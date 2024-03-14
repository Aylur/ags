import { register, type BaseProps, type Widget } from './widget.js';
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

type Transition = keyof typeof TRANSITION;

export type StackProps<
    Children extends { [name: string]: Gtk.Widget } = { [name: string]: Gtk.Widget },
    Attr = unknown,
    Self = Stack<Children, Attr>,
> = BaseProps<Self, Gtk.Stack.ConstructorProperties & {
    shown?: keyof Children,
    transition?: Transition
    children?: Children,
    // FIXME:
    items?: [string, Gtk.Widget][]
}, Attr>

export function newStack<
    Children extends { [name: string]: Gtk.Widget } = { [name: string]: Gtk.Widget },
    Attr = unknown,
>(...props: ConstructorParameters<typeof Stack<Children, Attr>>) {
    return new Stack(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Stack<Children, Attr> extends Widget<Attr> { }
export class Stack<Children extends { [name: string]: Gtk.Widget }, Attr> extends Gtk.Stack {
    static {
        register(this, {
            properties: {
                'transition': ['string', 'rw'],
                'shown': ['string', 'rw'],
                'children': ['jsobject', 'rw'],
                // FIXME: deprecated
                'items': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: StackProps<Children, Attr> = {}, children?: Children) {
        if (children)
            props.children = children;

        super(props as Gtk.Stack.ConstructorProperties);
        this.connect('notify::visible-child-name', () => this.notify('shown'));
    }

    add_named(child: Gtk.Widget, name: string): void {
        // @ts-expect-error
        this.children[name] = child;
        this.children = { ...this.children };
    }

    get children() { return this._get('children') || {}; }
    set children(children: Children) {
        if (!children)
            return;

        const oldCh = Object.values(this.children);
        const newCh = Object.values(children);
        for (const widget of oldCh) {
            if (!newCh.includes(widget))
                widget.destroy();
            else
                this.remove(widget);
        }

        this._set('children', children);
        for (const [name, widget] of Object.entries(children))
            super.add_named(widget, name);

        this.notify('children');
    }

    get items() {
        if (!Array.isArray(this._get('items')))
            this._set('items', []);

        return this._get('items');
    }

    set items(items: Array<[string, Gtk.Widget]>) {
        if (items)
            console.warn(Error('Stack.items is DEPRECATED, use Stack.children'));

        this.items
            .filter(([name]) => !items.find(([n]) => n === name))
            .forEach(([, ch]) => ch.destroy());

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

    get shown() { return this.visible_child_name as keyof Children; }
    set shown(name: keyof Children) {
        if (typeof name !== 'string')
            return;

        this.set_visible_child_name(name);
    }
}

export default Stack;
