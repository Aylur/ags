import Gtk from 'gi://Gtk?version=3.0';
import { Command } from './constructor.js';
export default class AgsEntry extends Gtk.Entry {
    onAccept: Command;
    onChange: Command;
    constructor({ onAccept, onChange, ...rest }: {
        [key: string]: Command;
    });
}
