import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';

export function interval(
    interval: number,
    callback: () => void,
    bind?: Gtk.Widget,
) {
    callback();
    const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
        callback();
        return true;
    });
    if (bind)
        bind.connect('destroy', () => GLib.source_remove(id));

    return id;
}

export function timeout(ms: number, callback: () => void) {
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        callback();
        return GLib.SOURCE_REMOVE;
    });
}

export function idle(callback: () => void, prio = GLib.PRIORITY_DEFAULT) {
    return GLib.idle_add(prio, () => {
        callback();
        return GLib.SOURCE_REMOVE;
    });
}
