import Gtk from 'gi://Gtk?version=3.0';
import { Command } from './constructor.js';
export interface Params {
    children?: InstanceType<typeof Gtk.Widget>[];
    onPopup?: Command;
    onMoveScroll?: Command;
}
export declare class AgsMenu extends Gtk.Menu {
    onPopup: Command;
    onMoveScroll: Command;
    constructor({ children, onPopup, onMoveScroll, ...rest }?: Params);
    get children(): InstanceType<typeof Gtk.Widget>[] | null;
    set children(children: InstanceType<typeof Gtk.Widget>[] | null);
}
export declare class AgsMenuItem extends Gtk.MenuItem {
    onActivate: Command;
    onSelect: Command;
    onDeselect: Command;
    constructor({ onActivate, onSelect, onDeselect, ...rest }: {
        [key: string]: any;
    });
}
