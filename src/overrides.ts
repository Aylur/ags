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
