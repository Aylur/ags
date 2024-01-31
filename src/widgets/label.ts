import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';

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

type Justification = keyof typeof JUSTIFICATION;
type Truncate = keyof typeof TRUNCATE;

export type Props<
    Attr = unknown,
    Self = Label<Attr>,
> = BaseProps<Self, Gtk.Label.ConstructorProperties & {
    justification?: Justification
    truncate?: Truncate
}, Attr>

export type LabelProps<Attr> = Props<Attr> | string | undefined

export interface Label<Attr> extends Widget<Attr> { }
export class Label<Attr> extends Gtk.Label {
    static {
        register(this, {
            properties: {
                'justification': ['string', 'rw'],
                'truncate': ['string', 'rw'],
            },
        });
    }

    constructor(props: LabelProps<Attr> = {}) {
        const { label, ...config } = props as Gtk.Label.ConstructorProperties;
        const text = typeof props === 'string' ? props : label;
        super(typeof props === 'string' ? {} : config);
        this._handleParamProp('label', text || '');
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
                    logError(e);
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

export default Label;
