import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

const transitions = [
    'none', 'crossfade',
    'slide_right', 'slide_left',
    'slide_up', 'slide_down',
] as const;

type Transition = typeof transitions[number];

export interface RevealerProps extends BaseProps<AgsRevealer>, Gtk.Revealer.ConstructorProperties {
    transition?: Transition
}

export default class AgsRevealer extends AgsWidget(Gtk.Revealer) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsRevealer',
            Properties: {
                'transition': Service.pspec('transition', 'string', 'rw'),
            },
        }, this);
    }

    constructor(props: RevealerProps = {}) { super(props); }

    get transition() { return transitions[this.transition_type]; }
    set transition(transition: Transition) {
        if (!transition || this.transition === transition)
            return;

        if (!transitions.includes(transition)) {
            console.error('wrong transition value for Revealer');
            return;
        }

        this.transition_type = transitions.findIndex(t => t === transition);
        this.notify('transition');
    }
}
