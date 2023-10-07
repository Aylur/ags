import Gtk from 'gi://Gtk?version=3.0';
export default class AgsProgressBar extends Gtk.ProgressBar {
    get value(): number;
    set value(value: number);
    get vertical(): boolean;
    set vertical(vertical: boolean);
}
