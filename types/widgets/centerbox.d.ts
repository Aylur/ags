import Gtk from 'gi://Gtk?version=3.0';
import AgsBox from './box.js';
export default class AgsCenterBox extends AgsBox {
    set children(children: InstanceType<typeof Gtk.Widget>[] | null);
    get start_widget(): InstanceType<typeof Gtk.Widget> | null;
    set start_widget(child: InstanceType<typeof Gtk.Widget> | null);
    get end_widget(): InstanceType<typeof Gtk.Widget> | null;
    set end_widget(child: InstanceType<typeof Gtk.Widget> | null);
    get center_widget(): InstanceType<typeof Gtk.Widget> | null;
    set center_widget(child: InstanceType<typeof Gtk.Widget> | null);
}
