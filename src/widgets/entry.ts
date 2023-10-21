import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GtkTypes from "../../types/gtk-types/gtk-3.0"
import { runCmd } from '../utils.js';
import { type Command } from './widget.js';

export interface EntryProps extends GtkTypes.Entry.ConstructorProperties {
    onAccept?: Command
    onChange?: Command
}

export default class AgsEntry extends Gtk.Entry {
    static { GObject.registerClass(this); }

    onAccept: Command;
    onChange: Command;

    constructor({ onAccept = '', onChange = '', ...rest }: EntryProps = {}) {
        super(rest);

        this.onAccept = onAccept;
        this.onChange = onChange;

        this.connect('activate', () => {
            typeof this.onAccept === 'function'
                ? this.onAccept(this)
                : runCmd(this.onAccept.replace(/\{\}/g, this.text || ''));
        });

        this.connect('notify::text', ({ text }, event) => {
            typeof this.onChange === 'function'
                ? this.onChange(this, event)
                : runCmd(this.onChange.replace(/\{\}/g, text || ''));
        });
    }
}
