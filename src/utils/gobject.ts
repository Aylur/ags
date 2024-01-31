import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';

type Camel<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${Camel<P3>}` : S

type Kebab<S extends string> = S extends `${infer Head}_${infer Tail}`
    ? `${Head}-${Kebab<Tail>}` : S

/**
 * turns a snake_cased Record into
 * snake & camel & kebab keyed Record
 */
export type CtorProps<T> =
    T &
    { [K in keyof T as Camel<string & K>]: T[K] } &
    { [K in keyof T as Kebab<string & K>]: T[K] }

export const kebabify = (str: string) => str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replaceAll('_', '-')
    .toLowerCase();

export type PspecFlag = 'rw' | 'r' | 'w';
export type PspecType =
    | 'jsobject'
    | 'string'
    | 'int'
    | 'float'
    | 'double'
    | 'boolean'
    | 'gobject'
    | 'widget';

export function pspec(name: string, type: PspecType = 'jsobject', handle: PspecFlag = 'r') {
    const flags = (() => {
        switch (handle) {
            case 'w': return GObject.ParamFlags.WRITABLE;
            case 'r': return GObject.ParamFlags.READABLE;
            case 'rw':
            default: return GObject.ParamFlags.READWRITE;
        }
    })();

    switch (type) {
        case 'string': return GObject.ParamSpec.string(
            name, name, name, flags, '');

        case 'int': return GObject.ParamSpec.int64(
            name, name, name, flags,
            Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0);

        case 'float': return GObject.ParamSpec.float(
            name, name, name, flags,
            -1, 1, 0);

        case 'double': return GObject.ParamSpec.double(
            name, name, name, flags,
            Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0);

        case 'boolean': return GObject.ParamSpec.boolean(
            name, name, name, flags, false);

        case 'gobject': return GObject.ParamSpec.object(
            name, name, name, flags, GObject.Object.$gtype);

        case 'widget': return GObject.ParamSpec.object(
            name, name, name, flags, Gtk.Widget.$gtype);

        default: return GObject.ParamSpec.jsobject(
            name, name, name, flags);
    }
}

export function registerGObject<
    Obj extends { new(...args: any[]): GObject.Object },
    Config extends {
        typename?: string,
        signals?: { [signal: string]: PspecType[] },
        properties?: { [prop: string]: [type?: PspecType, handle?: PspecFlag] },
        cssName?: string,
    },
>(object: Obj, config?: Config) {
    const Signals: {
        [signal: string]: { param_types: GObject.GType<unknown>[] }
    } = {};

    const Properties: {
        [prop: string]: GObject.ParamSpec,
    } = {};

    if (config && config.signals) {
        Object.keys(config.signals).forEach(signal => Signals[signal] = {
            param_types: config.signals![signal].map(t =>
                // @ts-expect-error
                GObject[`TYPE_${t.toUpperCase()}`]),
        });
    }

    if (config && config.properties) {
        Object.keys(config.properties).forEach(prop =>
            Properties[prop] = pspec(prop, ...config.properties![prop]),
        );
    }

    return GObject.registerClass(Object.assign({
        GTypeName: config?.typename || `Ags_${object.name}`,
        Signals,
        Properties,
    }, config?.cssName ? { CssName: config.cssName } : {}), object);
}
