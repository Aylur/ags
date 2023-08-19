import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

const justification = ['left', 'center', 'right', 'fill'];

export default class AgsLabel extends Gtk.Label {
    static {
        GObject.registerClass({
            GTypeName: 'AgsLabel',
            Properties: {
                'justification': GObject.ParamSpec.string(
                    'justification', 'Justification', 'Justification',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    '',
                ),
            },
        }, this);
    }

    constructor(params: object | string) {
        super(typeof params === 'string' ? { label: params } : params);
    }

    get justification() { return justification[this.justify]; }
    set justification(justify) {
        if (!justify)
            return;

        if (!justification.includes(justify)) {
            console.error('wrong justification value for Label');
            return;
        }

        // @ts-ignore
        this.justify = Gtk.Justification[justify.toUpperCase()];
    }
}
