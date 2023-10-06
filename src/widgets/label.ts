import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import Service from '../service/service.js';

const justifications = ['left', 'center', 'right', 'fill'];
const truncates = ['none', 'start', 'middle', 'end'];

export default class AgsLabel extends Gtk.Label {
    static {
        GObject.registerClass({
            GTypeName: 'AgsLabel',
            Properties: {
                'justification': Service.pspec('justification', 'string', 'rw'),
                'truncate': Service.pspec('truncate', 'string', 'rw'),
            },
        }, this);
    }

    constructor(params: object | string) {
        super(typeof params === 'string' ? { label: params } : params);
    }

    get label() { return super.label; }
    set label(label: string) {
        if (this.useMarkup) {
            try {
                // @ts-expect-error
                Pango.parse_markup(label, label.length, '0');
            } catch (e) {
                if (e instanceof GLib.MarkupError)
                    label = GLib.markup_escape_text(label, -1);
                else
                    logError(e as Error);
            }
        }
        super.label = label;
    }

    get truncate() { return truncates[this.ellipsize]; }
    set truncate(truncate: string) {
        if (!truncate)
            return;

        if (!truncate.includes(truncate)) {
            console.error('wrong truncate value for Label');
            return;
        }

        this.ellipsize = truncates.findIndex(t => t === truncate);
        this.notify('truncate');
    }

    get justification() { return justifications[this.justify]; }
    set justification(justify: string) {
        if (!justify)
            return;

        if (!justifications.includes(justify)) {
            console.error('wrong justification value for Label');
            return;
        }

        this.justify = justifications.findIndex(j => j === justify);
        this.notify('justification');
    }
}
