import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';
import App from '../app.js';
// @ts-expect-error missing types FIXME:
import { default as LayerShell } from 'gi://GtkLayerShell';

const ANCHOR = {
    'left': LayerShell.Edge.LEFT,
    'right': LayerShell.Edge.RIGHT,
    'top': LayerShell.Edge.TOP,
    'bottom': LayerShell.Edge.BOTTOM,
} as const;

const LAYER = {
    'background': LayerShell.Layer.BACKGROUND,
    'bottom': LayerShell.Layer.BOTTOM,
    'top': LayerShell.Layer.TOP,
    'overlay': LayerShell.Layer.OVERLAY,
} as const;

export type Layer = keyof typeof LAYER;
export type Anchor = keyof typeof ANCHOR;
export type Exclusivity = 'normal' | 'ignore' | 'exclusive';

export interface WindowProps extends BaseProps<AgsWindow>, Gtk.Window.ConstructorProperties {
    anchor?: Anchor[]
    exclusivity?: Exclusivity
    focusable?: boolean
    layer?: Layer
    margins?: number[]
    monitor?: number
    popup?: boolean
    visible?: boolean

    // FIXME: deprecated
    exclusive?: boolean
}

export default class AgsWindow extends AgsWidget(Gtk.Window) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsWindow',
            Properties: {
                'anchor': Service.pspec('anchor', 'jsobject', 'rw'),
                'exclusive': Service.pspec('exclusive', 'boolean', 'rw'),
                'exclusivity': Service.pspec('exclusivity', 'string', 'rw'),
                'focusable': Service.pspec('focusable', 'boolean', 'rw'),
                'layer': Service.pspec('layer', 'string', 'rw'),
                'margins': Service.pspec('margins', 'jsobject', 'rw'),
                'monitor': Service.pspec('monitor', 'int', 'rw'),
                'popup': Service.pspec('popup', 'boolean', 'rw'),
            },
        }, this);
    }

    // the window has to be set as a layer,
    // so we can't rely on gobject constructor
    constructor({
        anchor = [],
        exclusive,
        exclusivity = 'normal',
        focusable = false,
        layer = 'top',
        margins = [],
        monitor = -1,
        popup = false,
        visible = true,
        ...params
    }: WindowProps = {}) {
        super(params);
        LayerShell.init_for_window(this);
        LayerShell.set_namespace(this, this.name);

        this.anchor = anchor;
        this.exclusivity = exclusivity;
        this.exclusive = exclusive;
        this.focusable = focusable;
        this.layer = layer;
        this.margins = margins;
        this.monitor = monitor;
        this.show_all();
        this.popup = popup;
        this.visible = visible === true || visible === null && !popup;
    }

    get monitor(): Gdk.Monitor { return this._get('monitor'); }
    set monitor(monitor: number) {
        if (monitor < 0)
            return;

        const m = Gdk.Display.get_default()?.get_monitor(monitor);
        if (m) {
            LayerShell.set_monitor(this, m);
            this._set('monitor', monitor);
            return;
        }

        console.error(`Could not find monitor with id: ${monitor}`);
    }

    // FIXME: deprecated
    get exclusive() { return LayerShell.auto_exclusive_zone_is_enabled(this); }
    set exclusive(exclusive: boolean | undefined) {
        if (exclusive === undefined)
            return;

        console.error('Window.exclusive is DEPRECATED, use Window.exclusivity');
        if (this.exclusive === exclusive)
            return;

        exclusive
            ? LayerShell.auto_exclusive_zone_enable(this)
            : LayerShell.set_exclusive_zone(this, 0);

        this.notify('exclusive');
    }

    get exclusivity(): Exclusivity {
        if (LayerShell.auto_exclusive_zone_is_enabled(this))
            return 'exclusive';

        if (LayerShell.get_exclusive_zone(this) === -1)
            return 'ignore';

        return 'normal';
    }

    set exclusivity(exclusivity: Exclusivity) {
        if (this.exclusivity === exclusivity)
            return;

        switch (exclusivity) {
            case 'normal':
                LayerShell.set_exclusive_zone(this, 0);
                break;

            case 'ignore':
                LayerShell.set_exclusive_zone(this, -1);
                break;

            case 'exclusive':
                LayerShell.auto_exclusive_zone_enable(this);
                break;

            default:
                console.error(Error('wrong value for exclusivity'));
                break;
        }

        this.notify('exclusivity');
    }

    get layer() {
        return Object.keys(LAYER).find(layer => {
            return LAYER[layer as Layer] === LayerShell.get_layer(this);
        }) as Layer;
    }

    set layer(layer: Layer) {
        if (this.layer === layer)
            return;

        if (!Object.keys(LAYER).includes(layer)) {
            console.error('wrong layer value for Window');
            return;
        }

        LayerShell.set_layer(this, LAYER[layer]);
        this.notify('layer');
    }

    get anchor() {
        return Object.keys(ANCHOR).filter(key => {
            return LayerShell.get_anchor(this, ANCHOR[key as Anchor]);
        }) as Anchor[];
    }

    set anchor(anchor: Anchor[]) {
        if (this.anchor.length === anchor.length &&
            this.anchor.every(a => anchor.includes(a)))
            return;

        // reset
        Object.values(ANCHOR).forEach(side => LayerShell.set_anchor(this, side, false));

        anchor.forEach(side => {
            if (!Object.keys(ANCHOR).includes(side))
                return console.error(`${side} is not a valid anchor`);

            LayerShell.set_anchor(this, ANCHOR[side], true);
        });

        this.notify('anchor');
    }

    get margins() {
        return ['TOP', 'RIGHT', 'BOTTOM', 'LEFT'].map(edge =>
            LayerShell.get_margin(this, LayerShell.Edge[edge]),
        );
    }

    set margins(margin: number[]) {
        let margins: [side: string, index: number][] = [];
        switch (margin.length) {
            case 1:
                margins = [['TOP', 0], ['RIGHT', 0], ['BOTTOM', 0], ['LEFT', 0]];
                break;
            case 2:
                margins = [['TOP', 0], ['RIGHT', 1], ['BOTTOM', 0], ['LEFT', 1]];
                break;
            case 3:
                margins = [['TOP', 0], ['RIGHT', 1], ['BOTTOM', 2], ['LEFT', 1]];
                break;
            case 4:
                margins = [['TOP', 0], ['RIGHT', 1], ['BOTTOM', 2], ['LEFT', 3]];
                break;
            default:
                break;
        }

        margins.forEach(([side, i]) =>
            LayerShell.set_margin(this,
                LayerShell.Edge[side], (margin as number[])[i]),
        );

        this.notify('margins');
    }

    get popup() { return !!this._get('popup'); }
    set popup(popup: boolean) {
        if (this.popup === popup)
            return;

        if (this.popup) {
            const [esc, click] = this._get<[number, number]>('popup');
            this.disconnect(esc);
            this.disconnect(click);
        }

        if (popup) {
            const esc = this.connect('key-press-event', (_, event: Gdk.Event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    App.getWindow(this.name!)
                        ? App.closeWindow(this.name!)
                        : this.hide();
                }
            });

            const click = this.connect('button-release-event', () => {
                const [x, y] = this.get_pointer();
                if (x === 0 && y === 0)
                    App.closeWindow(this.name!);
            });

            this._set('popup', [esc, click]);
        }
    }

    get focusable() {
        return LayerShell.get_keyboard_mode(this) === LayerShell.KeyboardMode.ON_DEMAND;
    }

    set focusable(focusable: boolean) {
        if (this.focusable === focusable)
            return;

        LayerShell.set_keyboard_mode(
            this, LayerShell.KeyboardMode[focusable ? 'ON_DEMAND' : 'NONE']);

        this.notify('focusable');
    }
}
