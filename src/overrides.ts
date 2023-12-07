import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

Gio._promisify(Gio.DataInputStream.prototype, 'read_upto_async');

// @ts-ignore
GObject.Object.prototype.toJSON = function() {
    const result = {};
    const filter = ['parent', 'window', 'font-options'];
    const props = (this.constructor as unknown as GObject.ObjectClass)
        //@ts-ignore
        .list_properties()
        .filter(p => !filter.includes(p.name || ''));

    props.forEach(p => {
        try {
            //@ts-ignore
            result[p.name] = this[p.name];
        }
        catch (e) {
            logError(e);
        }
    });
    return result;
};
