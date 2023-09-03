import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Pango from 'gi://Pango';

const justification = ['left', 'center', 'right', 'fill'];
const truncate = ['none', 'start', 'middle', 'end'];

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
                'truncate': GObject.ParamSpec.string(
                    'truncate', 'Truncate', 'Truncate',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    '',
                ),
            },
        }, this);
    }

    constructor(params: object | string) {
        super(typeof params === 'string' ? { label: params } : params);
    }

    get truncate() { return truncate[this.ellipsize]; }
    set truncate(truncate: string) {
        if (!truncate)
            return;

        if (!truncate.includes(truncate)) {
            console.error('wrong truncate value for Label');
            return;
        }

        // @ts-expect-error
        this.ellipsize = Pango.EllipsizeMode[truncate.toUpperCase()];
    }

    get justification() { return justification[this.justify]; }
    set justification(justify: string) {
        if (!justify)
            return;

        if (!justification.includes(justify)) {
            console.error('wrong justification value for Label');
            return;
        }

        // @ts-expect-error
        this.justify = Gtk.Justification[justify.toUpperCase()];
    }
}
