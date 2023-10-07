import Gtk from 'gi://Gtk?version=3.0';
export default class AgsBox extends Gtk.Box {
    constructor({ children, ...rest }: {
        children?: InstanceType<typeof Gtk.Widget>[] | null;
    });
    get children(): InstanceType<typeof Gtk.Widget>[] | null;
    set children(children: InstanceType<typeof Gtk.Widget>[] | null);
    get vertical(): boolean;
    set vertical(vertical: boolean);
}
