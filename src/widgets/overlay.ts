import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type OverlayProps<Attr> = BaseProps<Overlay<Attr>, Gtk.Overlay.ConstructorProperties & {
    pass_through?: boolean
    overlays?: Gtk.Widget[]
    overlay?: Gtk.Widget
}, Attr>

export interface Overlay<Attr> extends Widget<Attr> { }
export class Overlay<Attr> extends Gtk.Overlay {
    static {
        register(this, {
            properties: {
                'pass-through': ['boolean', 'rw'],
                'overlays': ['jsobject', 'rw'],
                'overlay': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: OverlayProps<Attr> = {}) {
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

    get overlay() { return this.overlays[0]; }
    set overlay(overlay: Gtk.Widget) {
        this.overlays = [overlay];
        this.notify('overlay');
    }

    get overlays() {
        return this.get_children().filter(ch => ch !== this.child);
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

export default Overlay;
