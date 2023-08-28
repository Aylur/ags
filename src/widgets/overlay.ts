import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

export default class AgsOverlay extends Gtk.Overlay {
    static {
        GObject.registerClass({
            GTypeName: 'AgsOverlay',
            Properties: {
                'pass-through': GObject.ParamSpec.boolean(
                    'pass-through', 'Pass Through', 'Pass Through',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    false,
                ),
            },
        }, this);
    }

    constructor({ overlays = [], ...rest } = {}) {
        super(rest);
        this.overlays = overlays;
    }

    _passthrough = false;
    get pass_through() { return this._passthrough; }
    set pass_through(passthrough: boolean) {
        this._passthrough = passthrough;
        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, passthrough));
    }

    _overlays!: Gtk.Widget[];
    get overlays() { return this._overlays; }
    set overlays(overlays: Gtk.Widget[]) {
        this.get_children()
            .filter(ch => ch !== this.child && !overlays.includes(ch))
            .forEach(ch => ch.destroy());

        this.get_children()
            .filter(ch => ch !== this.child)
            .forEach(ch => this.remove(ch));

        this._overlays = [];
        overlays.forEach(ch => this.add_overlay(ch));

        // reset passthrough
        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, this.pass_through));
    }

    add_overlay(widget: Gtk.Widget): void {
        this._overlays.push(widget);
        super.add_overlay(widget);
    }
}
