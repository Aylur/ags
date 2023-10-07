import Service from './service.js';
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
declare class HyprlandService extends Service {
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
export default class Hyprland {
    static _instance: HyprlandService;
    static get instance(): HyprlandService;
    static getMonitor(id: number): object | undefined;
    static getWorkspace(id: number): object | undefined;
    static getClient(address: string): object | undefined;
    static get monitors(): object[];
    static get workspaces(): object[];
    static get clients(): object[];
    static get active(): Actives;
    static HyprctlGet(cmd: string): unknown | object;
}
export {};
