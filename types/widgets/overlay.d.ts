import Gtk from 'gi://Gtk?version=3.0';
export default class AgsOverlay extends Gtk.Overlay {
    get pass_through(): boolean;
    set pass_through(passthrough: boolean);
    get overlays(): InstanceType<typeof Gtk.Widget>[];
    set overlays(overlays: InstanceType<typeof Gtk.Widget>[]);
}
