import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

export interface OverlayProps extends Gtk.Overlay.ConstructorProperties {
    pass_through?: boolean
    overlays?: Gtk.Widget[]
}

export default class AgsOverlay extends Gtk.Overlay {
    static {
        GObject.registerClass({
            Properties: {
                'pass-through': Service.pspec('pass-through', 'boolean', 'rw'),
                'overlays': Service.pspec('overlays', 'jsobject', 'rw'),
            },
        }, this);
    }

    get pass_through() {
        return this.get_children()
            .map(ch => this.get_overlay_pass_through(ch))
            .every(p => p === true);
    }

    set pass_through(passthrough: boolean) {
        if (this.pass_through === passthrough)
            return;

        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, passthrough));

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

        // reset passthrough
        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, this.pass_through));

        this.notify('overlays');
    }
}
