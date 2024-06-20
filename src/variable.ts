import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Service, { Binding, Props } from './service.js';
import { execAsync, interval, subprocess } from './utils.js';

type Listen<T> =
    | [string[] | string, (out: string, self: Variable<T>) => T]
    | [string[] | string]
    | string[]
    | string;

type Poll<T> =
    | [number, string[] | string | ((self: Variable<T>) => T) | ((self: Variable<T>) => Promise<T>)]
    | [number, string[] | string, (out: string, self: Variable<T>) => T];

export interface Options<T> {
    poll?: Poll<T>
    listen?: Listen<T>
}

export class Variable<T> extends GObject.Object {
    static {
        Service.register(this, {
            'changed': [],
            'dispose': [],
        }, {
            'value': ['jsobject', 'rw'],
            'is-listening': ['boolean', 'r'],
            'is-polling': ['boolean', 'r'],
        });
    }

    protected _value!: T;
    protected _poll?: Poll<T>;
    protected _listen?: Listen<T>;
    protected _interval?: number;
    protected _subprocess?: Gio.Subprocess | null;

    constructor(value: T, { poll, listen }: Options<T> = {}) {
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

    startPoll() {
        if (!this._poll)
            return console.error(Error(`${this} has no poll defined`));

        if (this._interval)
            return console.error(Error(`${this} is already polling`));

        const [time, cmd, transform = (out: string) => out as T] = this._poll;
        if (Array.isArray(cmd) || typeof cmd === 'string') {
            this._interval = interval(time, () => execAsync(cmd)
                .then(out => this.value = transform(out, this))
                .catch(console.error));
        }
        if (typeof cmd === 'function') {
            this._interval = interval(time, () => {
                const value = cmd(this);
                if (value instanceof Promise)
                    value.then(v => this.value = v).catch(console.error);
                else
                    this.value = value;
            });
        }
        this.notify('is-polling');
    }

    stopPoll() {
        if (this._interval) {
            GLib.source_remove(this._interval);
            this._interval = 0;
        } else {
            console.error(Error(`${this} has no poll running`));
        }
        this.notify('is-polling');
    }

    startListen() {
        if (!this._listen)
            return console.error(Error(`${this} has no listen defined`));

        if (this._subprocess)
            return console.error(Error(`${this} is already listening`));

        let cmd: string | string[];
        const transform = typeof this._listen[1] === 'function'
            ? this._listen[1]
            : (out: string) => out as T;

        // string
        if (typeof this._listen === 'string')
            cmd = this._listen;

        // string[]
        else if (Array.isArray(this._listen) && this._listen.every(s => typeof s === 'string'))
            cmd = this._listen as string[];

        // [string, fn]
        else if (Array.isArray(this._listen) && typeof this._listen[0] === 'string')
            cmd = this._listen[0];

        // [string[], fn]
        else if (Array.isArray(this._listen) && Array.isArray(this._listen[0]))
            cmd = this._listen[0];

        else
            return console.error(Error(`${this._listen} is not a valid type for Variable.listen`));

        this._subprocess = subprocess(cmd, out => this.value = transform(out, this));
        this.notify('is-listening');
    }

    stopListen() {
        if (this._subprocess) {
            this._subprocess.force_exit();
            this._subprocess = null;
        } else {
            console.error(Error(`${this} has no listen running`));
        }
        this.notify('is-listening');
    }

    get is_listening() { return !!this._subprocess; }
    get is_polling() { return !!this._interval; }

    dispose() {
        if (this._interval)
            GLib.source_remove(this._interval);

        if (this._subprocess)
            this._subprocess.force_exit();

        this.emit('dispose');
        this.run_dispose();
    }

    getValue() { return this._value; }
    setValue(value: T) {
        this._value = value;
        this.notify('value');
        this.emit('changed');
    }

    get value() { return this._value; }
    set value(value: T) {
        if (value === this.value)
            return;

        this.setValue(value);
    }

    connect(signal = 'notify::value', callback: (self: this, ...args: any[]) => void): number {
        return super.connect(signal, callback);
    }

    bind<P extends keyof Props<this>>(): Binding<this, P, T>
    bind<P extends keyof Props<this>>(prop?: P): Binding<this, P, this[P]>
    bind<P extends keyof Props<this>>(prop: P = 'value' as P) {
        return new Binding(this, prop);
    }
}

export default <T>(value: T, options?: Options<T>) => new Variable(value, options);
