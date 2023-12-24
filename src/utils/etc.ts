import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export function loadInterfaceXML(iface: string) {
    const uri = `resource:///com/github/Aylur/ags/dbus/${iface}.xml`;
    const f = Gio.File.new_for_uri(uri);

    try {
        const [, bytes] = f.load_contents(null);
        return new TextDecoder().decode(bytes);
    } catch (e) {
        logError(e);
        return null;
    }
}

export function bulkConnect(
    service: GObject.Object,
    list: Array<[event: string, callback: (...args: any[]) => void]>,
) {
    const ids = [];
    for (const [event, callback] of list)
        ids.push(service.connect(event, callback));

    return ids;
}

export function bulkDisconnect(service: GObject.Object, ids: number[]) {
    for (const id of ids)
        service.disconnect(id);
}

export function lookUpIcon(name?: string, size = 16) {
    if (!name)
        return null;

    return Gtk.IconTheme.get_default().lookup_icon(
        name,
        size,
        Gtk.IconLookupFlags.USE_BUILTIN,
    );
}

export function ensureDirectory(path: string) {
    if (!GLib.file_test(path, GLib.FileTest.EXISTS))
        Gio.File.new_for_path(path).make_directory_with_parents(null);
}
