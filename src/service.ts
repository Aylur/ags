import GObject from 'gi://GObject';
import { pspec, registerGObject, PspecFlag, PspecType } from './utils/gobject.js';

export type Connectable = {
    connect: (sig: string, callback: (...args: unknown[]) => unknown) => number
    disconnect: (id: number) => void
}

export type OnlyString<S extends string | unknown> = S extends string ? S : never;

export type Props<T> = Omit<Pick<T, {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : OnlyString<K>
}[keyof T]>, 'g_type_instance'>;

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
    transformFn = (v: any) => v; // see #262
    constructor(emitter: Emitter, prop: Prop) {
        this.emitter = emitter;
        this.prop = prop;
    }

    /** alias for transform */
    as<T>(fn: (v: Return) => T) { return this.transform(fn); }

    transform<T>(fn: (v: Return) => T) {
        const bind = new Binding<Emitter, Prop, T>(this.emitter, this.prop);
        const prev = this.transformFn;
        bind.transformFn = (v: Return) => fn(prev(v));
        return bind;
    }
}

interface Services {
    applications: typeof import('./service/applications.js').default
    audio: typeof import('./service/audio.js').default
    battery: typeof import('./service/battery.js').default
    bluetooth: typeof import('./service/bluetooth.js').default
    hyprland: typeof import('./service/hyprland.js').default
    mpris: typeof import('./service/mpris.js').default
    network: typeof import('./service/network.js').default
    notifications: typeof import('./service/notifications.js').default
    powerprofiles: typeof import('./service/powerprofiles.js').default
    systemtray: typeof import('./service/systemtray.js').default
    greetd: typeof import('./service/greetd.js').default
}

export default class Service extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'AgsService',
            Signals: { 'changed': {} },
        }, this);
    }

    static async import<S extends keyof Services>(service: S): Promise<Services[S]> {
        return (await import(`./service/${service}.js`)).default;
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
