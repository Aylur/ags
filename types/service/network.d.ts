import NM from 'gi://NM';
import Service from './service.js';
declare class Wifi extends Service {
    private _client;
    private _device;
    private _ap;
    private _apBind;
    constructor(client: InstanceType<typeof NM.Client>, device: InstanceType<typeof NM.DeviceWifi>);
    scan(): void;
    private _activeAp;
    get access_points(): {
        bssid: string | null;
        address: string | null;
        lastSeen: number;
        ssid: string | null;
        active: boolean;
        strength: number;
        iconName: string | undefined;
    }[];
    get enabled(): boolean;
    set enabled(v: boolean);
    get strength(): number;
    get internet(): "disconnected" | "connecting" | "connected";
    get ssid(): string | null;
    get state(): "disconnected" | "prepare" | "config" | "failed" | "unmanaged" | "unavailable" | "need_auth" | "ip_config" | "ip_check" | "secondaries" | "activated" | "deactivating" | "unknown";
    get icon_name(): string;
}
declare class Wired extends Service {
    private _device;
    constructor(device: InstanceType<typeof NM.DeviceEthernet>);
    get speed(): number;
    get internet(): "disconnected" | "connecting" | "connected";
    get state(): "disconnected" | "prepare" | "config" | "failed" | "unmanaged" | "unavailable" | "need_auth" | "ip_config" | "ip_check" | "secondaries" | "activated" | "deactivating" | "unknown";
    get icon_name(): "network-wired-acquiring-symbolic" | "network-wired-symbolic" | "network-wired-no-route-symbolic" | "network-wired-disconnected-symbolic";
}
declare class NetworkService extends Service {
    private _client;
    wifi: Wifi;
    wired: Wired;
    primary?: string;
    connectivity: string;
    constructor();
    toggleWifi(): void;
    private _getDevice;
    private _clientReady;
    private _sync;
}
export default class Network {
    static _instance: NetworkService;
    static get instance(): NetworkService;
    static toggleWifi(): void;
    static get connectivity(): string;
    static get primary(): string | undefined;
    static get wifi(): Wifi;
    static get wired(): Wired;
}
export {};
