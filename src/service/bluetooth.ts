/* eslint-disable @typescript-eslint/no-explicit-any */
import GObject from 'gi://GObject';
import Service from './service.js';
import { bulkConnect, bulkDisconnect } from '../utils.js';

imports.gi.versions.GnomeBluetooth = '3.0';
const { GnomeBluetooth } = imports.gi;

class Device extends GObject.Object {
    static {
        GObject.registerClass({
            Signals: { 'changed': {} },
        }, this);
    }

    private _device: any;
    private _ids: number[];
    private _connecting = false;

    get device() { return this._device; }

    constructor(device: any) {
        super();

        this._device = device;
        this._ids = [
            'address',
            'alias',
            'battery-level',
            'battery-percentage',
            'connected',
            'icon',
            'name',
            'paired',
            'trusted',
        ].map(prop => device.connect(
            `notify::${prop}`, () => this.emit('changed'),
        ));
    }

    close() {
        bulkDisconnect(this._device, this._ids);
    }

    get address() { return this._device.address; }
    get alias() { return this._device.alias; }
    get connecting() { return this._connecting; }
    get connected() { return this._device.connected; }
    get batteryLevel() { return this._device.battery_level; }
    get batteryPercentage() { return this._device.battery_percentage; }
    get iconName() { return this._device.icon; }
    get name() { return this._device.name; }
    get paired() { return this._device.paired; }
    get trusted() { return this._device.trusted; }
    get type() { return GnomeBluetooth.type_to_string(this._device.type); }

    setConnection(connect: boolean) {
        this._connecting = true;
        Bluetooth.instance.connectDevice(this, connect, () => {
            this._connecting = false;
            this.emit('changed');
        });
        this.emit('changed');
    }
}

class BluetoothService extends Service {
    static { Service.register(this); }

    // @ts-expect-error
    private _client: GnomeBluetooth.Client;
    private _devices: Map<string, Device>;

    constructor() {
        super();

        this._devices = new Map();
        this._client = new GnomeBluetooth.Client();
        bulkConnect(this._client, [
            ['notify::default-adapter-state', () => this.emit('changed')],
            ['device-added', this._deviceAdded.bind(this)],
            ['device-removed', this._deviceRemoved.bind(this)],
        ]);
        this._getDevices().forEach(device => this._deviceAdded(this, device));
    }

    toggle() {
        this._client.default_adapter_powered =
            !this._client.default_adapter_powered;
    }

    private _getDevices() {
        const devices = [];
        const deviceStore = this._client.get_devices();

        for (let i = 0; i < deviceStore.get_n_items(); ++i) {
            const device = deviceStore.get_item(i);

            if (device.paired || device.trusted)
                devices.push(device);
        }

        return devices;
    }

    private _deviceAdded(_c: unknown, device: any) {
        if (this._devices.has(device.address))
            return;

        const d = new Device(device);
        d.connect('changed', () => this.emit('changed'));
        this._devices.set(device.address, d);
        this.emit('changed');
    }

    private _deviceRemoved(_c: unknown, device: Device) {
        if (!this._devices.has(device.address))
            return;

        this._devices.get(device.address)?.close();
        this._devices.delete(device.address);
        this.emit('changed');
    }

    connectDevice(
        device: Device,
        connect: boolean,
        callback: (s: boolean) => void,
    ) {
        this._client.connect_service(
            device.device.get_object_path(),
            connect,
            null,
            (client: any, res: any) => {
                try {
                    const s = client.connect_service_finish(res);
                    callback(s);
                } catch (error) {
                    logError(error as Error);
                    callback(false);
                }
            },
        );
    }

    getDevice(address: string) { return this._devices.get(address); }

    set enabled(v) { this._client.default_adapter_powered = v; }
    get enabled() { return this.state === 'on' || this.state === 'turning-on'; }

    get state() {
        switch (this._client.default_adapter_state) {
            case GnomeBluetooth.AdapterState.ON: return 'on';
            case GnomeBluetooth.AdapterState.TURNING_ONON: return 'turning-on';
            case GnomeBluetooth.AdapterState.OFF: return 'off';
            case GnomeBluetooth.AdapterState.TURNING_OFF: return 'turning-off';
            default: return 'absent';
        }
    }

    get devices() { return Array.from(this._devices.values()); }
    get connectedDevices() {
        const list = [];
        for (const [, device] of this._devices) {
            if (device.connected)
                list.push(device);
        }
        return list;
    }
}

export default class Bluetooth {
    static _instance: BluetoothService;

    static get instance() {
        Service.ensureInstance(Bluetooth, BluetoothService);
        return Bluetooth._instance;
    }

    static getDevice(address: string) { return Bluetooth.instance.getDevice(address); }

    static get devices() { return Bluetooth.instance.devices; }
    static get connectedDevices() { return Bluetooth.instance.connectedDevices; }
    static get enabled() { return Bluetooth.instance.enabled; }
    static set enabled(enable: boolean) { Bluetooth.instance.enabled = enable; }
}
