import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { execAsync, interval, subprocess } from './utils.js';

type Poll = [number, string[] | string | (() => unknown), (out: string) => string];
type Listen = [string[] | string, (out: string) => string] | string[] | string;

interface Options {
    poll?: Poll
    listen?: Listen
}

export class Variable extends GObject.Object {
    static {
        GObject.registerClass({
            GTypeName: 'AgsVariable',
            Signals: { 'changed': {} },
            Properties: {
                'value': GObject.ParamSpec.jsobject(
                    'value', 'value', 'value',
                    GObject.ParamFlags.READWRITE,
                ),
            },
        }, this);
    }

    private _value: unknown;
    private _poll?: Poll;
    private _listen?: Listen;
    private _interval?: number;
    private _subprocess?: Gio.Subprocess | null;

    constructor(value: unknown, { poll, listen }: Options = {}) {
        super();
        this.value = value;

        if (poll) {
            this._poll = poll;
            this.startPoll();
        }

        if (listen) {
            this._listen = listen;
            this.startListen();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connect(signal = 'notify::value', callback: (_: this, ...args: any[]) => void): number {
        return super.connect(signal, callback);
    }

    startPoll() {
        if (!this._poll)
            return console.error(Error(`${this} has no poll defined`));

        if (this._interval)
            return console.error(Error(`${this} is already polling`));

        const [time, cmd, transform = out => out] = this._poll;
        if (Array.isArray(cmd) || typeof cmd === 'string') {
            this._interval = interval(time, () => execAsync(cmd)
                .then(out => this.setValue(transform(out)))
                .catch(err => console.error(err)));
        }
        if (typeof cmd === 'function')
            this._interval = interval(time, () => this.setValue(cmd()));
    }

    stopPoll() {
        if (this._interval) {
            GLib.source_remove(this._interval);
            this._interval = 0;
        } else {
            console.error(Error(`${this} has no poll running`));
        }
    }

    startListen() {
        if (!this._listen)
            return console.error(Error(`${this} has no listen defined`));

        if (this._subprocess)
            return console.error(Error(`${this} is already listening`));

        let cmd: string | string[];
        const transform = typeof this._listen[1] === 'function'
            ? this._listen[1]
            : (out: string) => out;

        // listen: string
        if (typeof this._listen === 'string')
            cmd = this._listen;

        // listen: [string, fn]
        else if (Array.isArray(this._listen) && typeof this._listen[0] === 'string')
            cmd = this._listen[0];

        // listen: [string[], fn]
        else if (Array.isArray(this._listen) && Array.isArray(this._listen[0]))
            cmd = this._listen[0];

        else
            return console.error(Error(`${this._listen} is not a valid type for Variable.listen`));

        this._subprocess = subprocess(cmd, out => this.setValue(transform(out)));
    }

    stopListen() {
        if (this._subprocess) {
            this._subprocess.force_exit();
            this._subprocess = null;
        } else {
            console.error(Error(`${this} has no listen running`));
        }
    }

    get isListening() { return !!this._subprocess; }
    get isPolling() { return !!this._listen; }

    dispose() {
        if (this._interval)
            GLib.source_remove(this._interval);

        if (this._subprocess)
            this._subprocess.force_exit();

        this.run_dispose();
    }

    getValue() { return this._value; }
    setValue(value: unknown) {
        this._value = value;
        this.notify('value');
        this.emit('changed');
    }

    get value() { return this._value; }
    set value(value: unknown) { this.setValue(value); }
}

export default (value: unknown, options: Options) => new Variable(value, options);
