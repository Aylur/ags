import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { connect } from '../utils.js';
import { type Ctor } from 'gi-types/gobject2.js';

type PspecType = 'jsobject' | 'string' | 'int' | 'float' | 'boolean';
type PspecFlag = 'rw' | 'r' | 'w';

export default class Service extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'AgsService',
            Signals: { 'changed': {} },
        }, this);
    }

    static ensureInstance(api: { _instance: Service }, service: { new(): Service }) {
        if (!api._instance)
            api._instance = new service();
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

            case 'boolean': return GObject.ParamSpec.boolean(
                name, name, name, flags, false);

            // @ts-expect-error
            default: return GObject.ParamSpec.jsobject(
                name, name, name, flags, null);
        }
    }

    static register(
        service: Ctor,
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

    connectWidget(
        widget: Gtk.Widget,
        callback: (widget: Gtk.Widget, ...args: unknown[]) => void,
        event = 'changed',
    ) {
        connect(this, widget, callback, event);
    }

    updateProperty(prop: string, value: unknown) {
        // @ts-expect-error
        if (this[`_${prop}`] === value)
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
}

