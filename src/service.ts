import GObject from 'gi://GObject';

export type PspecType = 'jsobject' | 'string' | 'int' | 'float' | 'double' | 'boolean' | 'gobject';
export type PspecFlag = 'rw' | 'r' | 'w';

export const kebabify = (str: string) => str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replaceAll('_', '-')
    .toLowerCase();

export type OnlyString<S extends string | unknown> = S extends string ? S : never;

export type Props<T> = Pick<T, {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : OnlyString<K>
}[keyof T]>;

export type BindableProps<T> = {
    [K in keyof T]: Binding<any, any, NonNullable<T[K]>> | T[K];
}

export class Binding<
    Emitter extends GObject.Object,
    Prop extends keyof Props<Emitter>,
    Return = Emitter[Prop],
> {
    emitter: Emitter;
    prop: Prop;
    transformFn = (v: Return) => v;
    constructor(emitter: Emitter, prop: Prop) {
        this.emitter = emitter;
        this.prop = prop;
    }

    transform<T>(fn: (v: Return) => T) {
        const bind = new Binding<Emitter, Prop, T>(this.emitter, this.prop);
        const prev = bind.transformFn;
        // @ts-expect-error
        bind.transformFn = (v: Return) => fn(prev(v));
        return bind;
    }
}

export default class Service extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'AgsService',
            Signals: { 'changed': {} },
        }, this);
    }

    static pspec(name: string, type: PspecType = 'jsobject', handle: PspecFlag = 'r') {
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

            default: return GObject.ParamSpec.jsobject(
                name, name, name, flags);
        }
    }

    static register(
        service: new (...args: any[]) => GObject.Object,
        signals?: { [signal: string]: string[] },
        properties?: { [prop: string]: [type?: PspecType, handle?: PspecFlag] },
    ) {
        const Signals: {
            [signal: string]: { param_types: GObject.GType<unknown>[] }
        } = {};

        const Properties: {
            [prop: string]: GObject.ParamSpec,
        } = {};

        if (signals) {
            Object.keys(signals).forEach(signal => Signals[signal] = {
                param_types: signals[signal].map(t =>
                    // @ts-expect-error
                    GObject[`TYPE_${t.toUpperCase()}`]),
            });
        }

        if (properties) {
            Object.keys(properties).forEach(prop =>
                Properties[prop] = Service.pspec(prop, ...properties[prop]),
            );
        }

        GObject.registerClass({ Signals, Properties }, service);
    }

    connect(signal = 'changed', callback: (_: this, ...args: any[]) => void): number {
        return super.connect(signal, callback);
    }

    updateProperty(prop: string, value: unknown) {
        if (this[prop as keyof typeof this] === value ||
            JSON.stringify(this[prop as keyof typeof this]) === JSON.stringify(value))
            return;

        const privateProp = prop
            .split('-')
            .map((w, i) => i > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
            .join('');

        // @ts-expect-error
        this[`_${privateProp}`] = value;
        this.notify(prop);
    }

    changed(property: string) {
        this.notify(property);
        this.emit('changed');
    }

    bind<Prop extends keyof Props<this>>(prop: Prop) {
        return new Binding(this, prop);
    }
}
