import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import Service from '../service.js';

const justifications = ['left', 'center', 'right', 'fill'] as const;
const truncates = ['none', 'start', 'middle', 'end'] as const;

type Justification = typeof justifications[number];
type Truncate = typeof truncates[number];

interface Props extends BaseProps<AgsLabel>, Gtk.Label.ConstructorProperties {
    justification?: Justification
    truncate?: Truncate
}

export type LabelProps = Props | string | undefined

export default class AgsLabel extends AgsWidget(Gtk.Label) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsLabel',
            Properties: {
                'justification': Service.pspec('justification', 'string', 'rw'),
                'truncate': Service.pspec('truncate', 'string', 'rw'),
            },
        }, this);
    }

    constructor(props: LabelProps = {}) {
        super(typeof props === 'string' ? { label: props } : props);
    }

    get label() { return super.label || ''; }
    set label(label: string) {
        if (this.use_markup) {
            try {
                Pango.parse_markup(label, label.length, '0');
            } catch (e) {
                // @ts-expect-error
                if (e instanceof GLib.MarkupError)
                    label = GLib.markup_escape_text(label, -1) || '';
                else
                    console.error(e as Error);
            }
        }
        super.label = label;
    }

    get truncate() { return truncates[this.ellipsize]; }
    set truncate(truncate: Truncate) {
        if (this.truncate === truncate)
            return;

        if (!truncate.includes(truncate)) {
            console.error('wrong truncate value for Label');
            return;
        }

        this.ellipsize = truncates.findIndex(t => t === truncate);
        this.notify('truncate');
    }

    get justification() { return justifications[this.justify]; }
    set justification(justify: Justification) {
        if (this.justification === justify)
            return;

        if (!justifications.includes(justify)) {
            console.error('wrong justification value for Label');
            return;
        }

        this.justify = justifications.findIndex(j => j === justify);
        this.notify('justification');
    }
}
