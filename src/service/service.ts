import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { connect } from '../utils.js';

export default class Service extends GObject.Object {
    static {
        GObject.registerClass({
            Signals: { 'changed': {} },
        }, this);
    }

    static ensureInstance(api: { _instance: any }, service: { new(): any }) {
        if (!api._instance)
            api._instance = new service();
    }

    static register(service: any, signals?: { [signal: string]: string[] }) {
        const Signals: {
            [signal: string]: { param_types: GObject.GType<unknown>[] }
        } = {};

        if (signals) {
            Object.keys(signals).forEach(signal =>
                Signals[signal] = {
                    // @ts-ignore
                    param_types: signals[signal].map(t => GObject[`TYPE_${t.toUpperCase()}`]),
                },
            );
        }

        GObject.registerClass({ Signals }, service);
    }

    static export(api: any, name: string) {
        (Service as { [key: string]: any })[name] = api;
    }

    connectWidget(widget: Gtk.Widget, callback: (widget: Gtk.Widget, ...args: any[]) => void, event = 'changed') {
        connect(this, widget, callback, event);
    }
}
