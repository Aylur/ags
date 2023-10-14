import "./gtk-types/gtk-3.0-ambient";
import "./gtk-types/gdk-3.0-ambient";
import "./gtk-types/cairo-1.0-ambient";
import "./gtk-types/gnomebluetooth-3.0-ambient";
import "./gtk-types/dbusmenugtk3-0.4-ambient";
import "./gtk-types/gobject-2.0-ambient";
import "./gtk-types/nm-1.0-ambient";
import "./gtk-types/soup-3.0-ambient";
import "./gtk-types/gvc-1.0-ambient";
import GObject from 'gi://GObject';
type Poll<T> = [number, string[] | string | (() => T), (out: string) => T];
type Listen<T> = [string[] | string, (out: string) => T] | string[] | string;
interface Options<T> {
    poll?: Poll<T>;
    listen?: Listen<T>;
}
declare class AgsVariable<T> extends GObject.Object {
    private _value;
    private _poll?;
    private _listen?;
    private _interval?;
    private _subprocess?;
    constructor(value: T, { poll, listen }?: Options<T>);
    startPoll(): void;
    stopPoll(): void;
    startListen(): void;
    stopListen(): void;
    get isListening(): boolean;
    get isPolling(): boolean;
    dispose(): void;
    getValue(): T;
    setValue(value: any): void;
    get value(): T;
    set value(value: T);
}
declare const _default: <T>(value: T, options: Options<T>) => AgsVariable<T>;
export default _default;
