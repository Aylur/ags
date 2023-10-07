import Service from './service.js';
declare const GnomeBluetooth: typeof import("../../types/gtk-types/gnomebluetooth-3.0.js").GnomeBluetooth;
declare class BluetoothDevice extends Service {
    private _device;
    private _ids;
    private _connecting;
    get device(): import("../../types/gtk-types/gnomebluetooth-3.0.js").GnomeBluetooth.Device;
    constructor(device: InstanceType<typeof GnomeBluetooth.Device>);
    close(): void;
    get address(): string | null;
    get alias(): string | null;
    get battery_level(): number;
    get battery_percentage(): number;
    get connected(): boolean;
    get icon_name(): string | null;
    get name(): string | null;
    get paired(): boolean;
    get trusted(): boolean;
    get type(): string | null;
    get connecting(): boolean;
    setConnection(connect: boolean): void;
}
declare class BluetoothService extends Service {
    private _client;
    private _devices;
    constructor();
    toggle(): void;
    private _getDevices;
    private _deviceAdded;
    private _deviceRemoved;
    connectDevice(device: BluetoothDevice, connect: boolean, callback: (s: boolean) => void): void;
    getDevice(address: string): BluetoothDevice | undefined;
    set enabled(v: boolean);
    get enabled(): boolean;
    get state(): string;
    get devices(): BluetoothDevice[];
    get connected_devices(): BluetoothDevice[];
}
export default class Bluetooth {
    static _instance: BluetoothService;
    static get instance(): BluetoothService;
    static getDevice(address: string): BluetoothDevice | undefined;
    static get enabled(): boolean;
    static set enabled(enable: boolean);
    static get state(): string;
    static get devices(): BluetoothDevice[];
    static get connectedDevices(): BluetoothDevice[];
    static get connected_devices(): BluetoothDevice[];
    static get ['connected-devices'](): BluetoothDevice[];
}
export {};
