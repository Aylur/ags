/* eslint-disable @typescript-eslint/no-explicit-any */
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { execAsync, interval, subprocess } from './utils.js';

interface Options {
    poll?: [interval: number, cmd: string[] | string | (() => unknown)],
    listen?: string[] | string,
}

class AgsVariable extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'AgsVariable',
            Signals: { 'changed': {} },
        }, this);
    }

    _inerval?: number;
    _subprocess?: Gio.Subprocess | null;

    constructor(value: any, option: Options) {
        super();
        this.value = value;

        if (option.poll) {
            const [time, cmd] = option.poll;
            if (Array.isArray(cmd) || typeof cmd === 'string') {
                this._inerval = interval(time, () => execAsync(cmd)
                    .catch(logError)
                    .then(this.setValue.bind(this)));
            }
            if (typeof cmd === 'function')
                this._inerval = interval(time, () => this.setValue(cmd()));
        }

        if (option.listen)
            this._subprocess = subprocess(option.listen, this.setValue.bind(this), logError);
    }

    dispose() {
        if (this._inerval)
            GLib.source_remove(this._inerval);

        this._subprocess?.force_exit();
        this.run_dispose();
    }

    private _value: any;

    getValue() { return this._value; }
    setValue(value: any) {
        this._value = value;
        this.emit('changed');
    }

    get value() { return this._value; }
    set value(value: any) { this.setValue(value); }
}

export default (value: any, options: Options) => new AgsVariable(value, options);
