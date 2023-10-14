import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

const transitions = [
    'none', 'crossfade',
    'slide_right', 'slide_left',
    'slide_up', 'slide_down',
];

export default class AgsRevealer extends Gtk.Revealer {
    static {
        GObject.registerClass({
            GTypeName: 'AgsRevealer',
            Properties: {
                'transition': Service.pspec('transition', 'string', 'rw'),
            },
        }, this);
    }

    get transition() { return transitions[this.transition_type]; }
    set transition(transition: string) {
        if (!transition || this.transition === transition)
            return;

        if (!transitions.includes(transition)) {
            console.error('wrong transition value for Revealer');
            return;
        }

        this.transition_type = transitions.findIndex(t => t === transition);
    }
}
