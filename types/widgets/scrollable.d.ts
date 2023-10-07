import Gtk from 'gi://Gtk?version=3.0';
export default class AgsScrollable extends Gtk.ScrolledWindow {
    constructor(params: object);
    get hscroll(): string;
    set hscroll(hscroll: string);
    get vscroll(): string;
    set vscroll(vscroll: string);
    policy(): void;
}
