import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/soup-3.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import Service from '../service.js';
declare class Active extends Service {
    updateProperty(prop: string, value: unknown): void;
}
declare class ActiveClient extends Active {
    private _address;
    private _title;
    private _class;
    get address(): string;
    get title(): string;
    get class(): string;
}
declare class ActiveWorkspace extends Active {
    private _id;
    private _name;
    get id(): number;
    get name(): string;
}
declare class Actives extends Service {
    constructor();
    private _client;
    private _monitor;
    private _workspace;
    get client(): ActiveClient;
    get monitor(): string;
    get workspace(): ActiveWorkspace;
}
declare class Hyprland extends Service {
    private _active;
    private _monitors;
    private _workspaces;
    private _clients;
    private _decoder;
    get active(): Actives;
    get monitors(): object[];
    get workspaces(): object[];
    get clients(): object[];
    getMonitor(id: number): object | undefined;
    getWorkspace(id: number): object | undefined;
    getClient(address: string): object | undefined;
    constructor();
    private _watchSocket;
    private _syncMonitors;
    private _syncWorkspaces;
    private _syncClients;
    private _onEvent;
}
declare const _default: Hyprland;
export default _default;
