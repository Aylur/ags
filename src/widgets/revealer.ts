import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

const transitions = [
    'none', 'crossfade',
    'slide_right', 'slide_left',
    'slide_up', 'slide_down',
];

export default class Revealer extends Gtk.Revealer {
    static {
        GObject.registerClass({
            GTypeName: 'AgsRevealer',
            Properties: {
                'transition': GObject.ParamSpec.string(
                    'transition', 'Transition', 'transition-type as a string',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    'none',
                ),
            },
        }, this);
    }

    get transition() { return transitions[this.transitionType]; }
    set transition(transition: string) {
        if (!transition)
            return;

        if (!transitions.includes(transition)) {
            console.error('wrong transition value for Revealer');
            return;
        }

        // @ts-ignore
        this.transitionType = Gtk.RevealerTransitionType[transition.toUpperCase()];
    }

    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget)
            this.remove(widget);

        if (child)
            this.add(child);
    }
}
