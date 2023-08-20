import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import App from '../app.js';

const { GtkLayerShell } = imports.gi;

export default class AgsWindow extends Gtk.Window {
    static {
        GObject.registerClass({ GTypeName: 'AgsWindow' }, this);
    }

    constructor({
        anchor = [],
        exclusive = false,
        focusable = false,
        layer = 'top',
        margin = [],
        monitor = null,
        popup = false,
        visible = null,
        ...params
    }: any) {
        super(params);
        GtkLayerShell.init_for_window(this);
        GtkLayerShell.set_namespace(this, this.name);

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

    set monitor(monitor: number | null) {
        if (monitor === null)
            return;

        if (typeof monitor === 'number') {
            const m = Gdk.Display.get_default()?.get_monitor(monitor);
            m
                ? GtkLayerShell.set_monitor(this, m)
                : console.error(`Could not find monitor with id: ${monitor}`);
        }
    }

    _exclusive = false;
    get exclusive() { return this._exclusive; }
    set exclusive(exclusive: boolean) {
        this._exclusive = exclusive;
        exclusive
            ? GtkLayerShell.auto_exclusive_zone_enable(this)
            : GtkLayerShell.set_exclusive_zone(this, 0);
    }

    _layer = 'top';
    get layer() { return this._layer; }
    set layer(layer: string) {
        this._layer;
        GtkLayerShell.set_layer(this,
            GtkLayerShell.Layer[layer?.toUpperCase()]);
    }

    _anchor: string[] = [];
    get anchor() { return this._anchor; }
    set anchor(anchor: string[] | string) {
        this._anchor = [];
        ['TOP', 'LEFT', 'RIGHT', 'BOTTOM'].forEach(side =>
            GtkLayerShell.set_anchor(
                this, GtkLayerShell.Edge[side], false,
            ),
        );

        if (typeof anchor === 'string')
            anchor = anchor.split(/\s+/);

        if (Array.isArray(anchor)) {
            anchor.forEach(side => {
                GtkLayerShell.set_anchor(
                    this,
                    GtkLayerShell.Edge[side.toUpperCase()],
                    true,
                );
                this._anchor.push(side);
            });
        }
    }

    _margin: number[] | number = [0];

    // @ts-ignore
    get margin() { return this._margin; }

    // @ts-ignore
    set margin(margin: number[] | number) {
        let margins: [side: string, index: number][] = [];
        if (typeof margin === 'number')
            margin = [margin];

        switch (margin.length) {
            case 1:
                margins = [
                    ['TOP', 0], ['RIGHT', 0], ['BOTTOM', 0], ['LEFT', 0]];
                break;
            case 2:
                margins = [
                    ['TOP', 0], ['RIGHT', 1], ['BOTTOM', 0], ['LEFT', 1]];
                break;
            case 3:
                margins = [
                    ['TOP', 0], ['RIGHT', 1], ['BOTTOM', 2], ['LEFT', 1]];
                break;
            case 4:
                margins = [
                    ['TOP', 0], ['RIGHT', 1], ['BOTTOM', 2], ['LEFT', 3]];
                break;
            default:
                break;
        }

        margins.forEach(([side, i]) =>
            GtkLayerShell.set_margin(this,
                GtkLayerShell.Edge[side], (margin as number[])[i]),
        );

        this._margin = margin;
    }

    _popup!: number;
    get popup() { return !!this._popup; }
    set popup(popup: boolean) {
        if (this._popup)
            this.disconnect(this._popup);

        if (popup) {
            this.connect('key-press-event', (_, event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    App.getWindow(this.name)
                        ? App.closeWindow(this.name)
                        : this.hide();
                }
            });
        }
    }

    get focusable() {
        return GtkLayerShell.get_keyboard_mode(this) ===
            GtkLayerShell.KeyboardMode.ON_DEMAND;
    }

    set focusable(focusable: boolean) {
        GtkLayerShell.set_keyboard_mode(
            this, GtkLayerShell.KeyboardMode[focusable ? 'ON_DEMAND' : 'NONE'],
        );
    }

    // @ts-ignore
    get child() { return this.get_child(); }
    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget)
            widget.destroy();

        if (child)
            this.add(child);
    }
}
