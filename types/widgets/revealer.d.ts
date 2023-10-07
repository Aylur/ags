import Gtk from 'gi://Gtk?version=3.0';
export default class AgsRevealer extends Gtk.Revealer {
    get transition(): string;
    set transition(transition: string);
}
