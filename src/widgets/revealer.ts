import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

const TRANSITION = {
    'none': Gtk.RevealerTransitionType.NONE,
    'crossfade': Gtk.RevealerTransitionType.CROSSFADE,
    'slide_right': Gtk.RevealerTransitionType.SLIDE_RIGHT,
    'slide_left': Gtk.RevealerTransitionType.SLIDE_LEFT,
    'slide_up': Gtk.RevealerTransitionType.SLIDE_UP,
    'slide_down': Gtk.RevealerTransitionType.SLIDE_DOWN,
} as const;

type Transition = keyof typeof TRANSITION;

export type RevealerProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = Revealer<Child, Attr>,
> = BaseProps<Self, Gtk.Revealer.ConstructorProperties & {
    child?: Child
    transition?: Transition
}, Attr>

export function newRevealer<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof Revealer<Child, Attr>>) {
    return new Revealer(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Revealer<Child, Attr> extends Widget<Attr> { }
export class Revealer<Child extends Gtk.Widget, Attr> extends Gtk.Revealer {
    static {
        register(this, {
            properties: { 'transition': ['string', 'rw'] },
        });
    }

    constructor(props: RevealerProps<Child, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;

        super(props as Gtk.Revealer.ConstructorProperties);
        this.connect('notify::transition-type', () => this.notify('transition'));
    }

    get child() { return super.child as Child; }
    set child(child: Child) { super.child = child; }


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
                `transition on Revealer has to be one of ${Object.keys(TRANSITION)}, ` +
                `but it is ${transition}`,
            ));
            return;
        }

        this.transition_type = TRANSITION[transition];
    }
}

export default Revealer;
