/* eslint-disable @typescript-eslint/no-explicit-any */
import GObject from 'gi://GObject';
import { execAsync, interval, subprocess } from './utils.js';

interface Options {
    poll?: [interval: number, cmd: string[]],
    listen?: string[],
}

class AgsVariable extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'AgsVariable',
            Signals: { 'changed': {} },
        }, this);
    }

    constructor(value: any, option: Options) {
        super();
        this.value = value;

        if (option.poll) {
            const [time, cmd] = option.poll;
            interval(time, () => execAsync(cmd)
                .catch(logError)
                .then(this.setValue.bind(this)));
        }

        if (option.listen)
            subprocess(option.listen, this.setValue.bind(this));
    }

    private _value: any;

    getValue() { return this._value; }
    setValue(value: any) {
        if (this._value === value)
            return;

        this._value = value;
        this.emit('changed');
    }

    get value() { return this._value; }
    set value(value: any) { this.setValue(value); }
}

export default (value: any, options: Options) => new AgsVariable(value, options);
