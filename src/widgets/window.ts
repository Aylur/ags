import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';
import App from '../app.js';

// @ts-expect-error - no types
const { GtkLayerShell: LayerShell } = imports.gi;

const layers = ['background', 'bottom', 'top', 'overlay'] as const;
const anchors = ['left', 'right', 'top', 'bottom'] as const;

interface Params {
    anchor?: typeof anchors[number][]
    exclusive?: boolean
    focusable?: boolean
    layer?: typeof layers[number]
    margin?: number[]
    monitor?: number
    popup?: boolean
    visible?: boolean
}

export default class AgsWindow extends Gtk.Window {
    static {
        GObject.registerClass({
            GTypeName: 'AgsWindow',
            Properties: {
                'anchor': Service.pspec('anchor', 'jsobject', 'rw'),
                'exclusive': Service.pspec('exclusive', 'boolean', 'rw'),
                'focusable': Service.pspec('focusable', 'boolean', 'rw'),
                'layer': Service.pspec('layer', 'string', 'rw'),
                'margin': Service.pspec('margin', 'jsobject', 'rw'),
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
        margin = [],
        monitor = -1,
        popup = false,
        visible = true,
        ...params
    }: Params = {}) {
        super(params);
        LayerShell.init_for_window(this);
        LayerShell.set_namespace(this, this.name);

        this.anchor = anchor;
        this.exclusive = exclusive;
        this.focusable = focusable;
        this.layer = layer;
        this.margin = margin;
        this.monitor = monitor;
        this.show_all();
        this.popup = popup;
        this.visible = visible === true || visible === null && !popup;
    }

    _monitor: InstanceType<typeof Gdk.Monitor> | null = null;
    get monitor() { return this._monitor; }
    set monitor(monitor: number | null | InstanceType<typeof Gdk.Monitor>) {
	if(!monitor) return

        if ((typeof monitor === 'number' && monitor < 0) || this.monitor === monitor)
            return;

        const m = typeof monitor === 'number' ? Gdk.Display.get_default()?.get_monitor(monitor) : monitor;

        if (m) {
            LayerShell.set_monitor(this, m);
            // @ts-expect-error
            this._monitor = monitor;
            this.notify('monitor');
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

    get layer() { return layers[LayerShell.get_layer(this)]; }
    set layer(layer: typeof layers[number]) {
        if (this.layer === layer)
            return;

        if (!layers.includes(layer)) {
            console.error('wrong layer value for Window');
            return;
        }

        LayerShell.set_layer(this, layers.findIndex(l => l === layer));
        this.notify('layer');
    }

    get anchor() { return anchors.filter((_, i) => LayerShell.get_anchor(this, i)); }
    set anchor(anchor: typeof anchors[number][]) {
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

    // @ts-expect-error
    get margin() {
        return ['TOP', 'RIGHT', 'BOTTOM', 'LEFT'].map(edge =>
            LayerShell.get_margin(this, LayerShell.Edge[edge]),
        );
    }

    // @ts-expect-error
    set margin(margin: number[]) {
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

        this.notify('margin');
    }

    // @ts-expect-error
    get popup() { return !!this._popup; }

    // this will be removed in gtk4
    set popup(popup: boolean) {
        if (this.popup === popup)
            return;

        // @ts-expect-error
        if (this._popup)
            // @ts-expect-error
            this.disconnect(this._popup);

        if (popup) {
            this.connect('key-press-event', (_, event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    App.getWindow(this.name!)
                        ? App.closeWindow(this.name!)
                        : this.hide();
                }
            });
        }

        this.notify('popup');
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
