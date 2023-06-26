import * as Utils from '../utils.js';
import { Label } from './basic.js';
import GLib from 'gi://GLib';

export function Clock({ type, format, interval, ...props }) {
    interval ||= 1000;
    format ||= '%H:%M:%S %B %e. %A';
    Utils.typecheck('interval', interval, 'number', type);
    Utils.typecheck('format', format, 'string', 'clock');

    const label = Label({ ...props, label: GLib.DateTime.new_now_local().format(format) });
    Utils.interval(label, interval, () => {
        label.label = GLib.DateTime.new_now_local().format(format);
    });

    return label;
}
