import NM from 'gi://NM';
import GObject from 'gi://GObject';
import Service from './service.js';
import { bulkConnect } from '../utils.js';

const _INTERNET = (device: InstanceType<typeof NM.Device>) => {
    switch (device?.active_connection?.state) {
        case NM.ActiveConnectionState.ACTIVATED: return 'connected';
        case NM.ActiveConnectionState.ACTIVATING: return 'connecting';
        case NM.ActiveConnectionState.DEACTIVATING:
        case NM.ActiveConnectionState.DEACTIVATED:
        default: return 'disconnected';
    }
};

const _DEVICE_STATE = (device: InstanceType<typeof NM.Device>) => {
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

const _CONNECTIVITY_STATE = (client: InstanceType<typeof NM.Client>) => {
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
        default: return '';
    }
};

class Wifi extends Service {
    static {
        Service.register(this, {}, {
            'enabled': ['boolean', 'rw'],
            'internet': ['boolean'],
            'strength': ['int'],
            'access-points': ['jsobject'],
            'ssid': ['string'],
            'state': ['string'],
            'icon-name': ['string'],
        });
    }

    private _client: InstanceType<typeof NM.Client>;
    private _device: InstanceType<typeof NM.DeviceWifi>;
    private _ap!: InstanceType<typeof NM.AccessPoint>;
    private _apBind!: number;

    constructor(client: InstanceType<typeof NM.Client>, device: InstanceType<typeof NM.DeviceWifi>) {
        super();
        this._client = client;
        this._device = device;

        if (this._device) {
            bulkConnect((this._device as unknown) as Service, [
                ['notify::active-access-point', this._activeAp.bind(this)],
                ['access-point-added', () => this.emit('changed')],
                ['access-point-removed', () => this.emit('changed')],
            ]);
            this._activeAp();
        }
    }

    scan() {
        this._device.request_scan_async(null, (device, res) => {
            device.request_scan_finish(res);
            this.emit('changed');
        });
    }

    private _activeAp() {
        if (this._ap)
            this._ap.disconnect(this._apBind);

        this._ap = this._device.get_active_access_point();
        if (!this._ap)
            return;


        // TODO make signals actually signal when they should
        this._apBind = this._ap.connect('notify::strength', () => {
            this.emit('changed');
            ['enabled', 'internet', 'strength', 'access-points', 'ssid', 'state', 'icon-name']
                .map(prop => this.notify(prop));
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
            iconName: _STRENGTH_ICONS.find(({ value }) => value <= ap.strength)?.icon,
        }));
    }

    get enabled() { return this._client.wireless_enabled; }
    set enabled(v) { this._client.wireless_enabled = v; }

    get strength() { return this._ap?.strength || -1; }
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

class Wired extends Service {
    static {
        Service.register(this, {}, {
            'speed': ['int'],
            'internet': ['string'],
            'state': ['string'],
            'icon-name': ['string'],
        });
    }

    private _device: InstanceType<typeof NM.DeviceEthernet>;

    constructor(device: InstanceType<typeof NM.DeviceEthernet>) {
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

        if (Network.connectivity !== 'full')
            return 'network-wired-no-route-symbolic';

        return 'network-wired-disconnected-symbolic';
    }
}

class NetworkService extends Service {
    static {
        Service.register(this, {}, {
            'wifi': ['jsobject'],
            'wired': ['jsobject'],
            'primary': ['string'],
            'connectivity': ['string'],
        });
    }

    private _client!: InstanceType<typeof NM.Client>;

    wifi!: Wifi;
    wired!: Wired;
    primary?: string;
    connectivity!: string;

    constructor() {
        super();
        NM.Client.new_async(null, (_s, result) => {
            try {
                this._client = NM.Client.new_finish(result);
                this._clientReady();
            }
            catch (e) {
                console.error(e as Error);
            }
        });
    }

    toggleWifi() {
        this._client.wireless_enabled = !this._client.wireless_enabled;
    }

    private _getDevice(devType: typeof NM.DeviceType[keyof typeof NM.DeviceType]) {
        return this._client
            .get_devices()
            .find(device => device.get_device_type() === devType);
    }

    private _clientReady() {
        bulkConnect(this._client, [
            ['notify::wireless-enabled', this._sync.bind(this)],
            ['notify::connectivity', this._sync.bind(this)],
            ['notify::primary-connection', this._sync.bind(this)],
            ['notify::activating-connection', this._sync.bind(this)],
        ]);

        this.wifi = new Wifi(this._client,
            this._getDevice(NM.DeviceType.WIFI) as InstanceType<typeof NM.DeviceWifi>);

        this.wired = new Wired(
            this._getDevice(NM.DeviceType.ETHERNET) as InstanceType<typeof NM.DeviceEthernet>);

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

export default class Network {
    static _instance: NetworkService;

    static get instance() {
        Service.ensureInstance(Network, NetworkService);
        return Network._instance;
    }

    static toggleWifi() { Network.instance.toggleWifi(); }
    static get connectivity() { return Network.instance.connectivity; }
    static get primary() { return Network.instance.primary; }
    static get wifi() { return Network.instance.wifi; }
    static get wired() { return Network.instance.wired; }
}
