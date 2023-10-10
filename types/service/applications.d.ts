import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/soup-3.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import Gio from 'gi://Gio';
import Service from './service.js';
declare class Application extends Service {
    _app: InstanceType<typeof Gio.DesktopAppInfo>;
    _frequency: number;
    get app(): import("../../types/gtk-types/gio-2.0.js").Gio.DesktopAppInfo;
    get frequency(): number;
    get name(): string | null;
    get desktop(): string | null;
    get description(): string | null;
    get wm_class(): string | null;
    get executable(): string;
    get icon_name(): string | null;
    constructor(app: InstanceType<typeof Gio.DesktopAppInfo>, frequency: number);
    private _match;
    getKey(key: string): string | null;
    match(term: string): boolean;
    launch(): void;
}
declare class ApplicationsService extends Service {
    private _list;
    private _frequents;
    query(term: string): Application[];
    constructor();
    get list(): Application[];
    get frequents(): {
        [app: string]: number;
    };
    private _launched;
    private _sync;
}
export default class Applications {
    static _instance: ApplicationsService;
    static get instance(): ApplicationsService;
    static query(term: string): Application[];
    static get list(): Application[];
    static get frequents(): {
        [app: string]: number;
    };
}
export {};
