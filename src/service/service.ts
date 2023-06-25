import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { timeout } from '../utils.js';

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

    static register(service: any, signals?: { [signal: string]: GObject.GType<unknown>[] }) {
        const Signals: {
            [signal: string]: { param_types: any[] }
        } = {};

        if (signals) {
            Object.keys(signals).forEach(signal =>
                Signals[signal] = {
                    param_types: signals[signal],
                },
            );
        }

        GObject.registerClass({ Signals }, service);
    }

    static export(api: any, name: string) {
        (Service as { [key: string]: any })[name] = api;
    }

    listen(widget: Gtk.Widget, callback: (widget: Gtk.Widget) => void) {
        const bind = this.connect('changed', () => callback(widget));
        widget.connect('destroy', () => this.disconnect(bind));
        timeout(10, () => callback(widget));
    }
}
