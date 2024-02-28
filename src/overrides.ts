import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';

const PROP_FILTER = ['parent', 'window', 'font-options', 'pixels'];

// @ts-expect-error
GObject.Object.prototype.toJSON = function() {
    const result = {};
    const props = (this.constructor as unknown as GObject.ObjectClass)
        //@ts-expect-error
        .list_properties()
        .filter(p => !PROP_FILTER.includes(p.name || ''));

    props.forEach(p => {
        try {
            //@ts-expect-error
            result[p.name] = this[p.name];
        }
        catch (e) {
            logError(e as object, p.name);
        }
    });
    return result;
};

Object.defineProperty(Gtk.Bin.prototype, 'child', {
    get() { return this.get_child(); },
    set(child) {
        const prev = this.get_child();
        if (prev)
            this.remove(prev);

        if (prev !== child)
            prev?.destroy();

        this.add(child);
    },
});

