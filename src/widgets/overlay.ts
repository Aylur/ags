import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

export type OverlayProps = BaseProps<AgsOverlay, Gtk.Overlay.ConstructorProperties & {
    pass_through?: boolean
    overlays?: Gtk.Widget[]
}>

export default class AgsOverlay extends AgsWidget(Gtk.Overlay) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsOverlay',
            Properties: {
                'pass-through': Service.pspec('pass-through', 'boolean', 'rw'),
                'overlays': Service.pspec('overlays', 'jsobject', 'rw'),
            },
        }, this);
    }

    constructor(props: OverlayProps = {}) {
        super(props as Gtk.Overlay.ConstructorProperties);
    }

    private _updatePassThrough() {
        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, this._get('pass-through')));
    }

    get pass_through() { return this._get('pass-through'); }
    set pass_through(passthrough: boolean) {
        if (this.pass_through === passthrough)
            return;

        this._set('pass-through', passthrough);
        this._updatePassThrough();
        this.notify('pass-through');
    }

    get overlays() {
        return this.get_children().filter(ch => ch === this.child);
    }

    set overlays(overlays: Gtk.Widget[]) {
        this.get_children()
            .filter(ch => ch !== this.child && !overlays.includes(ch))
            .forEach(ch => ch.destroy());

        this.get_children()
            .filter(ch => ch !== this.child)
            .forEach(ch => this.remove(ch));

        overlays.forEach(ch => this.add_overlay(ch));
        this._updatePassThrough();
        this.notify('overlays');
    }
}
