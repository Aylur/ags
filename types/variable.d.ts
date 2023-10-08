import "./gtk-types/gtk-3.0-ambient";
import "./gtk-types/gdk-3.0-ambient";
import "./gtk-types/cairo-1.0-ambient";
import "./gtk-types/gnomebluetooth-3.0-ambient";
import "./gtk-types/dbusmenugtk3-0.4-ambient";
import "./gtk-types/gobject-2.0-ambient";
import "./gtk-types/nm-1.0-ambient";
import "./gtk-types/gvc-1.0-ambient";
import GObject from 'gi://GObject';
type Poll = [number, string[] | string | (() => unknown), (out: string) => string];
type Listen = [string[] | string, (out: string) => string] | string[] | string;
interface Options {
    poll?: Poll;
    listen?: Listen;
}
declare class AgsVariable extends GObject.Object {
    private _value;
    private _poll?;
    private _listen?;
    private _interval?;
    private _subprocess?;
    constructor(value: any, { poll, listen }?: Options);
    startPoll(): void;
    stopPoll(): void;
    startListen(): void;
    stopListen(): void;
    get isListening(): boolean;
    get isPolling(): boolean;
    dispose(): void;
    getValue(): any;
    setValue(value: any): void;
    get value(): any;
    set value(value: any);
}
declare const _default: (value: any, options: Options) => AgsVariable;
export default _default;
