import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';

const justification = ['left', 'center', 'right', 'fill'];
const truncate = ['none', 'start', 'middle', 'end'];

interface Params {
    label?: string
    [key: string]: unknown
}

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

    constructor(params: Params | string) {
        const label = typeof params === 'string' ? params : params.label;
        if (typeof params === 'object')
            delete params.label;

        super(typeof params === 'string' ? {} : params);
        this.label = label || '';
    }

    set label(label: string) {
        if (this.useMarkup) {
            try {
                // @ts-expect-error
                Pango.parse_markup(label, label.length, '0');
            } catch (e) {
                if (e instanceof GLib.MarkupError)
                    label = GLib.markup_escape_text(label, label.length);
                else
                    logError(e as Error);
            }
        }
        super.label = label;
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
