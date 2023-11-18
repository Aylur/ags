import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';
import App from '../app.js';

const { GtkLayerShell: LayerShell } = imports.gi;

const layers = ['background', 'bottom', 'top', 'overlay'] as const;
const anchors = ['left', 'right', 'top', 'bottom'] as const;
type Layer = typeof layers[number]
type Anchor = typeof anchors[number]

export interface WindowProps extends BaseProps<AgsWindow>, Gtk.Window.ConstructorProperties {
    anchor?: Anchor[]
    exclusive?: boolean
    focusable?: boolean
    layer?: Layer
    margins?: number[]
    monitor?: number
    gdkmonitor?: Gdk.Monitor
    popup?: boolean
    visible?: boolean
}

export default class AgsWindow extends AgsWidget(Gtk.Window) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsWindow',
            Properties: {
                'anchor': Service.pspec('anchor', 'jsobject', 'rw'),
                'exclusive': Service.pspec('exclusive', 'boolean', 'rw'),
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
        exclusive = false,
        focusable = false,
        layer = 'top',
        margins = [],
        monitor = -1,
        gdkmonitor = undefined,
        popup = false,
        visible = true,
        ...params
    }: WindowProps = {}) {
        super(params);
        LayerShell.init_for_window(this);
        LayerShell.set_namespace(this, this.name);

        this.anchor = anchor;
        this.exclusive = exclusive;
        this.focusable = focusable;
        this.layer = layer;
        this.margins = margins;
        this.monitor = monitor;
        if (gdkmonitor)
            this.gdkmonitor = gdkmonitor;
        this.show_all();
        this.popup = popup;
        this.visible = visible === true || visible === null && !popup;
    }

    _gdkmonitor: Gdk.Monitor | null = null;
    get gdkmonitor(): Gdk.Monitor { return this._gdkmonitor ?? this.monitor }
    set gdkmonitor(monitor: Gdk.Monitor ) {
        this._gdkmonitor = monitor;
        LayerShell.set_monitor(this, monitor);
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

    get exclusive() { return LayerShell.auto_exclusive_zone_is_enabled(this); }
    set exclusive(exclusive: boolean) {
        if (this.exclusive === exclusive)
            return;

        exclusive
            ? LayerShell.auto_exclusive_zone_enable(this)
            : LayerShell.set_exclusive_zone(this, 0);

        this.notify('exclusive');
    }

    get layer() { return layers[LayerShell.get_layer(this)] as Layer; }
    set layer(layer: Layer) {
        if (this.layer === layer)
            return;

        if (!layers.includes(layer)) {
            console.error('wrong layer value for Window');
            return;
        }

        LayerShell.set_layer(this, layers.findIndex(l => l === layer));
        this.notify('layer');
    }

    get anchor() { return anchors.filter((_, i) => LayerShell.get_anchor(this, i)) as Anchor[]; }
    set anchor(anchor: Anchor[]) {
        if (this.anchor.length === anchor.length &&
            this.anchor.every(a => anchor.includes(a)))
            return;

        ['TOP', 'LEFT', 'RIGHT', 'BOTTOM'].forEach(side =>
            LayerShell.set_anchor(this, LayerShell.Edge[side], false));

        anchor.forEach(side => {
            if (!anchors.includes(side)) {
                console.error(`${side} is not a valid anchor`);
                return;
            }

            LayerShell.set_anchor(this, anchors.findIndex(a => a === side), true);
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

        if (this.popup)
            this.disconnect(this._get('popup'));

        if (popup) {
            this._set('popup', this.connect('key-press-event', (_, event: Gdk.Event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    App.getWindow(this.name!)
                        ? App.closeWindow(this.name!)
                        : this.hide();
                }
            }));
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
