import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { runCmd } from '../utils.js';

export default class Entry extends Gtk.Entry {
    static {
        GObject.registerClass({ GTypeName: 'AgsEntry' }, this);
    }

    onAccept: string | ((...args: any[]) => void);
    onChange: string | ((...args: any[]) => void);

    constructor({
        onAccept = '',
        onChange = '',
        ...rest
    }: { [key: string]: any }) {
        super(rest);

        this.onAccept = onAccept;
        this.onChange = onChange;

        this.connect('activate', () => {
            typeof this.onAccept === 'function'
                ? this.onAccept(this)
                : runCmd(this.onAccept.replace(/\{\}/g, this.text));
        });

        this.connect('notify::text', ({ text }, event) => {
            typeof this.onChange === 'function'
                ? this.onChange(this, event)
                : runCmd(this.onChange.replace(/\{\}/g, text));
        });
    }
}
