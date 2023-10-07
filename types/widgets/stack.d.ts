import Gtk from 'gi://Gtk?version=3.0';
export default class AgsStack extends Gtk.Stack {
    add_named(child: InstanceType<typeof Gtk.Widget>, name: string): void;
    get items(): [string, InstanceType<typeof Gtk.Widget>][];
    set items(items: [string, InstanceType<typeof Gtk.Widget>][]);
    get transition(): string;
    set transition(transition: string);
    get shown(): string;
    set shown(name: string);
}
