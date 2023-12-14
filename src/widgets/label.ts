import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import Service from '../service.js';

const JUSTIFICATION = {
    'left': Gtk.Justification.LEFT,
    'right': Gtk.Justification.RIGHT,
    'center': Gtk.Justification.CENTER,
    'fill': Gtk.Justification.FILL,
} as const;

const TRUNCATE = {
    'none': Pango.EllipsizeMode.NONE,
    'start': Pango.EllipsizeMode.START,
    'middle': Pango.EllipsizeMode.MIDDLE,
    'end': Pango.EllipsizeMode.END,
} as const;

export type Justification = keyof typeof JUSTIFICATION;
export type Truncate = keyof typeof TRUNCATE;

export interface Props extends BaseProps<AgsLabel>, Gtk.Label.ConstructorProperties {
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

    get truncate() {
        return Object.keys(TRUNCATE).find(key => {
            return TRUNCATE[key as Truncate] === this.ellipsize;
        }) as Truncate;
    }

    set truncate(truncate: Truncate) {
        if (this.truncate === truncate)
            return;

        if (!Object.keys(TRUNCATE).includes(truncate)) {
            console.error(Error(
                `truncate for Label has to be one of ${Object.keys(TRUNCATE)}, ` +
                `but it is ${truncate}`,
            ));
            return;
        }

        this.ellipsize = TRUNCATE[truncate];
        this.notify('truncate');
    }

    get justification() {
        return Object.keys(JUSTIFICATION).find(key => {
            return JUSTIFICATION[key as Justification] === this.justify;
        }) as Justification;
    }

    set justification(justify: Justification) {
        if (this.justification === justify)
            return;

        if (!Object.keys(JUSTIFICATION).includes(justify)) {
            console.error(Error(
                `justify for Label has to be one of ${Object.keys(JUSTIFICATION)}, ` +
                `but it is ${justify}`,
            ));
            return;
        }

        this.justify = JUSTIFICATION[justify];
        this.notify('justification');
    }
}
