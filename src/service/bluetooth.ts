// @ts-expect-error missing types
import GnomeBluetooth from 'gi://GnomeBluetooth?version=3.0';
import Service from '../service.js';
import Gio from 'gi://Gio';
import { bulkConnect, bulkDisconnect } from '../utils.js';

const _ADAPTER_STATE = {
    [GnomeBluetooth.AdapterState.ABSENT]: 'absent',
    [GnomeBluetooth.AdapterState.ON]: 'on',
    [GnomeBluetooth.AdapterState.TURNING_ON]: 'turning-on',
    [GnomeBluetooth.AdapterState.TURNING_OFF]: 'turning-off',
    [GnomeBluetooth.AdapterState.OFF]: 'off',
};

export class BluetoothDevice extends Service {
    static {
        Service.register(this, {}, {
            'address': ['string'],
            'alias': ['string'],
            'battery-level': ['int'],
            'battery-percentage': ['int'],
            'connected': ['boolean'],
            'icon-name': ['string'],
            'name': ['string'],
            'paired': ['boolean'],
            'trusted': ['boolean'],
            'type': ['string'],
            'connecting': ['boolean'],
        });
    }

    private _device: GnomeBluetooth.Device;
    private _ids: number[];
    private _connecting = false;

    get device() { return this._device; }

    constructor(device: GnomeBluetooth.Device) {
        super();

        this._device = device;
        this._ids = [
            'address',
            'alias',
            'battery-level',
            'battery-percentage',
            'connected',
            'name',
            'paired',
            'trusted',
        ].map(prop => device.connect(`notify::${prop}`, () => {
            this.changed(prop);
        }));

        this._ids.push(device.connect('notify::icon', () => {
            this.changed('icon-name');
        }));
    }

    close() {
        bulkDisconnect(this._device, this._ids);
    }

    get address() { return this._device.address; }
    get alias() { return this._device.alias; }
    get battery_level() { return this._device.battery_level; }
    get battery_percentage() { return this._device.battery_percentage; }
    get connected() { return this._device.connected; }
    get icon_name() { return this._device.icon; }
    get name() { return this._device.name; }
    get paired() { return this._device.paired; }
    get trusted() { return this._device.trusted; }
    get type() { return GnomeBluetooth.type_to_string(this._device.type); }
    get connecting() { return this._connecting || false; }

    readonly setConnection = (connect: boolean) => {
        this._connecting = true;
        bluetooth.connectDevice(this, connect, () => {
            this._connecting = false;
            this.changed('connecting');
        });
        this.changed('connecting');
    };
}

export class Bluetooth extends Service {
    static {
        Service.register(this, {
            'device-added': ['string'],
            'device-removed': ['string'],
        }, {
            'devices': ['jsobject'],
            'connected-devices': ['jsobject'],
            'enabled': ['boolean', 'rw'],
            'state': ['string'],
        });
    }

    private _client: GnomeBluetooth.Client;
    private _devices: Map<string, BluetoothDevice>;

    constructor() {
        super();

        this._devices = new Map();
        this._client = new GnomeBluetooth.Client();
        bulkConnect(this._client, [
            ['device-added', this._deviceAdded.bind(this)],
            ['device-removed', this._deviceRemoved.bind(this)],
            ['notify::default-adapter-state', () => this.changed('state')],
            ['notify::default-adapter-powered', () => this.changed('enabled')],
        ]);

        this._getDevices().forEach(device => this._deviceAdded(this, device));
    }

    readonly toggle = () => {
        this._client.default_adapter_powered = !this._client.default_adapter_powered;
    };

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

    private _deviceAdded(_: GnomeBluetooth.Client, device: GnomeBluetooth.Device) {
        if (this._devices.has(device.address))
            return;

        const d = new BluetoothDevice(device);
        d.connect('changed', () => this.emit('changed'));
        d.connect('notify::connected', () => this.notify('connected-devices'));
        this._devices.set(device.address, d);
        this.changed('devices');
        this.emit('device-added', device.address);
    }

    private _deviceRemoved(_: GnomeBluetooth.Client, path: string) {
        const device = this.devices.find(d => d.device.get_object_path() === path);
        if (!device || !this._devices.has(device.address))
            return;

        this._devices.get(device.address)?.close();
        this._devices.delete(device.address);
        this.notify('devices');
        this.notify('connected-devices');
        this.emit('changed');
        this.emit('device-removed', device.address);
    }

    readonly connectDevice = (
        device: BluetoothDevice,
        connect: boolean,
        callback: (s: boolean) => void,
    ) => {
        this._client.connect_service(
            device.device.get_object_path(),
            connect,
            null,
            (client: GnomeBluetooth.Client, res: Gio.AsyncResult) => {
                try {
                    const s = client.connect_service_finish(res);
                    callback(s);

                    this.changed('connected-devices');
                } catch (error) {
                    logError(error);
                    callback(false);
                }
            },
        );
    };

    readonly getDevice = (address: string) => this._devices.get(address);

    set enabled(v) { this._client.default_adapter_powered = v; }
    get enabled() { return this.state === 'on' || this.state === 'turning-on'; }

    get state() { return _ADAPTER_STATE[this._client.default_adapter_state]; }

    get devices() { return Array.from(this._devices.values()); }
    get connected_devices() {
        const list = [];
        for (const [, device] of this._devices) {
            if (device.connected)
                list.push(device);
        }
        return list;
    }
}

export const bluetooth = new Bluetooth;
export default bluetooth;
