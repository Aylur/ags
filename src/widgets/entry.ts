import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { runCmd } from '../utils.js';
import { type Command } from './widget.js';

export interface EntryProps extends BaseProps<AgsEntry>, Gtk.Entry.ConstructorProperties {
    onAccept?: Command
    onChange?: Command
}

export default class AgsEntry extends AgsWidget(Gtk.Entry) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsEntry',
        }, this);
    }

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
