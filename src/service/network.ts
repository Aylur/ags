import NM from 'gi://NM';
import GObject from 'gi://GObject';
import Service from '../service.js';
import { bulkConnect } from '../utils.js';

const _INTERNET = (device: NM.Device) => {
    switch (device?.active_connection?.state) {
        case NM.ActiveConnectionState.ACTIVATED: return 'connected';
        case NM.ActiveConnectionState.ACTIVATING: return 'connecting';
        case NM.ActiveConnectionState.DEACTIVATING:
        case NM.ActiveConnectionState.DEACTIVATED:
        default: return 'disconnected';
    }
};

const _DEVICE_STATE = (device: NM.Device) => {
    switch (device?.state) {
        case NM.DeviceState.UNMANAGED: return 'unmanaged';
        case NM.DeviceState.UNAVAILABLE: return 'unavailable';
        case NM.DeviceState.DISCONNECTED: return 'disconnected';
        case NM.DeviceState.PREPARE: return 'prepare';
        case NM.DeviceState.CONFIG: return 'config';
        case NM.DeviceState.NEED_AUTH: return 'need_auth';
        case NM.DeviceState.IP_CONFIG: return 'ip_config';
        case NM.DeviceState.IP_CHECK: return 'ip_check';
        case NM.DeviceState.SECONDARIES: return 'secondaries';
        case NM.DeviceState.ACTIVATED: return 'activated';
        case NM.DeviceState.DEACTIVATING: return 'deactivating';
        case NM.DeviceState.FAILED: return 'failed';
        default: return 'unknown';
    }
};

const _CONNECTIVITY_STATE = (client: NM.Client) => {
    switch (client.connectivity) {
        case NM.ConnectivityState.NONE: return 'none';
        case NM.ConnectivityState.PORTAL: return 'portal';
        case NM.ConnectivityState.LIMITED: return 'limited';
        case NM.ConnectivityState.FULL: return 'full';
        default: return 'unknown';
    }
};

const _STRENGTH_ICONS = [
    { value: 80, icon: 'network-wireless-signal-excellent-symbolic' },
    { value: 60, icon: 'network-wireless-signal-good-symbolic' },
    { value: 40, icon: 'network-wireless-signal-ok-symbolic' },
    { value: 20, icon: 'network-wireless-signal-weak-symbolic' },
    { value: 0, icon: 'network-wireless-signal-none-symbolic' },
];

const DEVICE = (device: string) => {
    switch (device) {
        case '802-11-wireless': return 'wifi';
        case '802-3-ethernet': return 'wired';
        default: return null;
    }
};

export class Wifi extends Service {
    static {
        Service.register(this, {}, {
            'enabled': ['boolean', 'rw'],
            'internet': ['boolean'],
            'strength': ['int'],
            'frequency': ['int'],
            'access-points': ['jsobject'],
            'ssid': ['string'],
            'state': ['string'],
            'icon-name': ['string'],
        });
    }

    private _client: NM.Client;
    private _device: NM.DeviceWifi;
    private _ap!: NM.AccessPoint;
    private _apBind!: number;

    constructor(client: NM.Client, device: NM.DeviceWifi) {
        super();
        this._client = client;
        this._device = device;

        this._client.connect('notify::wireless-enabled', () => this.changed('enabled'));
        if (this._device) {
            bulkConnect((this._device as unknown) as Service, [
                ['notify::active-access-point', this._activeAp.bind(this)],
                ['access-point-added', () => this.emit('changed')],
                ['access-point-removed', () => this.emit('changed')],
            ]);
            this._activeAp();
        }
    }

    readonly scan = () => {
        this._device.request_scan_async(null, (device, res) => {
            device.request_scan_finish(res);
            this.emit('changed');
        });
    };

    private _activeAp() {
        if (this._ap)
            this._ap.disconnect(this._apBind);

        this._ap = this._device.get_active_access_point();
        if (!this._ap)
            return;


        // TODO make signals actually signal when they should
        this._apBind = this._ap.connect('notify::strength', () => {
            this.emit('changed');
            const props = [
                'enabled',
                'internet',
                'strength',
                'frequency',
                'access-points',
                'ssid',
                'state',
                'icon-name',
            ];
            props.map(prop => this.notify(prop));
        });
    }

    get access_points() {
        return this._device.get_access_points().map(ap => ({
            bssid: ap.bssid,
            address: ap.hw_address,
            lastSeen: ap.last_seen,
            ssid: ap.ssid
                ? NM.utils_ssid_to_utf8(ap.ssid.get_data() || new Uint8Array)
                : 'Unknown',
            active: ap === this._ap,
            strength: ap.strength,
            frequency: ap.frequency,
            iconName: _STRENGTH_ICONS.find(({ value }) => value <= ap.strength)?.icon,
        }));
    }

    get enabled() { return this._client.wireless_enabled; }
    set enabled(v) { this._client.wireless_enabled = v; }

    get strength() { return this._ap?.strength || -1; }
    get frequency() { return this._ap?.frequency || -1; }
    get internet() { return _INTERNET(this._device); }
    get ssid() {
        if (!this._ap)
            return '';

        const ssid = this._ap.get_ssid().get_data();
        if (!ssid)
            return 'Unknown';

        return NM.utils_ssid_to_utf8(ssid);
    }

    get state() { return _DEVICE_STATE(this._device); }

    get icon_name() {
        const iconNames: [number, string][] = [
            [80, 'excellent'],
            [60, 'good'],
            [40, 'ok'],
            [20, 'weak'],
            [0, 'none'],
        ];

        if (this.internet === 'connected') {
            for (const [threshold, name] of iconNames) {
                if (this.strength >= threshold)
                    return `network-wireless-signal-${name}-symbolic`;
            }
        }

        if (this.internet === 'connecting')
            return 'network-wireless-acquiring-symbolic';

        if (this.enabled)
            return 'network-wireless-offline-symbolic';

        return 'network-wireless-disabled-symbolic';
    }
}

export class Wired extends Service {
    static {
        Service.register(this, {}, {
            'speed': ['int'],
            'internet': ['string'],
            'state': ['string'],
            'icon-name': ['string'],
        });
    }

    private _device: NM.DeviceEthernet;

    constructor(device: NM.DeviceEthernet) {
        super();
        this._device = device;

        // TODO make signals actually signal when they should
        this._device?.connect('notify::speed', () => {
            this.emit('changed');
            ['speed', 'internet', 'state', 'icon-name']
                .map(prop => this.notify(prop));
        });
    }

    get speed() { return this._device.get_speed(); }
    get internet() { return _INTERNET(this._device); }
    get state() { return _DEVICE_STATE(this._device); }
    get icon_name() {
        if (this.internet === 'connecting')
            return 'network-wired-acquiring-symbolic';

        if (this.internet === 'connected')
            return 'network-wired-symbolic';

        if (network.connectivity !== 'full')
            return 'network-wired-no-route-symbolic';

        return 'network-wired-disconnected-symbolic';
    }
}

export class Network extends Service {
    static {
        Service.register(this, {}, {
            'wifi': ['jsobject'],
            'wired': ['jsobject'],
            'primary': ['string'],
            'connectivity': ['string'],
        });
    }

    private _client!: NM.Client;

    wifi!: Wifi;
    wired!: Wired;
    primary: null | 'wifi' | 'wired' = null;
    connectivity!: string;

    constructor() {
        super();
        try {
            this._client = new NM.Client;
            this._client.init(null);
            this._clientReady();
        }
        catch (e) {
            logError(e);
        }
    }

    readonly toggleWifi = () => {
        this._client.wireless_enabled = !this._client.wireless_enabled;
    };

    private _getDevice(devType: NM.DeviceType) {
        return this._client
            .get_devices()
            .find(device => device.get_device_type() === devType);
    }

    private _clientReady() {
        bulkConnect(this._client as unknown as GObject.Object, [
            ['notify::wireless-enabled', this._sync.bind(this)],
            ['notify::connectivity', this._sync.bind(this)],
            ['notify::primary-connection', this._sync.bind(this)],
            ['notify::activating-connection', this._sync.bind(this)],
        ]);

        this.wifi = new Wifi(this._client,
            this._getDevice(NM.DeviceType.WIFI) as NM.DeviceWifi);

        this.wired = new Wired(
            this._getDevice(NM.DeviceType.ETHERNET) as NM.DeviceEthernet);

        this.wifi.connect('changed', this._sync.bind(this));
        this.wired.connect('changed', this._sync.bind(this));

        this._sync();
    }

    private _sync() {
        const mainConnection =
            this._client.get_primary_connection() ||
            this._client.get_activating_connection();

        this.primary = DEVICE(mainConnection?.type || '');
        this.connectivity = _CONNECTIVITY_STATE(this._client);

        this.notify('primary');
        this.notify('connectivity');
        this.emit('changed');
    }
}

const network = new Network;
export default network;
