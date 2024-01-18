import AgsWidget, { type BaseProps } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

const TRANSITION = {
    'none': Gtk.RevealerTransitionType.NONE,
    'crossfade': Gtk.RevealerTransitionType.CROSSFADE,
    'slide_right': Gtk.RevealerTransitionType.SLIDE_RIGHT,
    'slide_left': Gtk.RevealerTransitionType.SLIDE_LEFT,
    'slide_up': Gtk.RevealerTransitionType.SLIDE_UP,
    'slide_down': Gtk.RevealerTransitionType.SLIDE_DOWN,
} as const;

export type Transition = keyof typeof TRANSITION;

export type RevealerProps = BaseProps<AgsRevealer, Gtk.Revealer.ConstructorProperties & {
    transition?: Transition
}>

export default class AgsRevealer extends AgsWidget(Gtk.Revealer) {
    static {
        AgsWidget.register(this, {
            properties: { 'transition': ['string', 'rw'] },
        });
    }

    constructor(props: RevealerProps = {}, child?: Gtk.Widget) {
        // @ts-expect-error super._init
        super(props as Gtk.Revealer.ConstructorProperties, child);
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
                `transition on Revealer has to be one of ${Object.keys(TRANSITION)}, ` +
                `but it is ${transition}`,
            ));
            return;
        }

        this.transition_type = TRANSITION[transition];
        this.notify('transition');
    }
}
