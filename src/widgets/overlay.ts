import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

export default class Overlay extends Gtk.Overlay {
    static {
        GObject.registerClass({
            GTypeName: 'AgsOverlay',
            Properties: {
                'child': GObject.ParamSpec.object(
                    'child', 'Child', 'Child',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    Gtk.Widget.$gtype,
                ),
                // @ts-ignore
                'overlays': GObject.ParamSpec.jsobject(
                    'overlays', 'Overlays', 'Overlays',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    [],
                ),
                'pass-through': GObject.ParamSpec.boolean(
                    'pass-through', 'Pass Through', 'Pass Through',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    false,
                ),
            },
        }, this);
    }

    _passthrough = false;
    get pass_through() { return this._passthrough; }
    set pass_through(passthrough: boolean) {
        this._passthrough = passthrough;
        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, passthrough));
    }

    _child!: Gtk.Widget;
    get child() { return this._child; }
    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget)
            widget.destroy();

        this._child = child;
        if (child)
            this.add(child);
    }

    _overlays!: Gtk.Widget[];
    get overlays() { return this._overlays; }
    set overlays(overlays: Gtk.Widget[]) {
        overlays ||= [];
        this.get_children().filter(ch => ch !== this._child)
            .forEach(ch => ch.destroy());

        this._overlays = [];
        overlays.forEach(ch => this.add_overlay(ch));
    }

    add_overlay(widget: Gtk.Widget): void {
        this._overlays.push(widget);
        super.add_overlay(widget);
    }
}
