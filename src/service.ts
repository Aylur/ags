import GObject from 'gi://GObject';
import { pspec, registerGObject, PspecFlag, PspecType } from './gobject.js';

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
        return pspec(name, type, handle);
    }

    static register(
        service: new (...args: any[]) => GObject.Object,
        signals?: { [signal: string]: PspecType[] },
        properties?: { [prop: string]: [type?: PspecType, handle?: PspecFlag] },
    ) {
        registerGObject(service, { signals, properties });
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
