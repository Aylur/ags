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

const _CONNECTION_STATE = (activeConnection: NM.ActiveConnection | null) => {
    switch (activeConnection?.get_state()) {
        case NM.ActiveConnectionState.ACTIVATED: return 'connected';
        case NM.ActiveConnectionState.ACTIVATING: return 'connecting';
        case NM.ActiveConnectionState.DEACTIVATING: return 'disconnecting';
        case NM.ActiveConnectionState.DEACTIVATED:
        default: return 'disconnected';
    }
};

const _VPN_CONNECTION_STATE = (activeVpnConnection: ActiveVpnConnection) => {
    switch (activeVpnConnection?.get_vpn_state()) {
        case NM.VpnConnectionState.UNKNOWN: return 'unknown';
        case NM.VpnConnectionState.PREPARE: return 'prepare';
        case NM.VpnConnectionState.NEED_AUTH: return 'needs_auth';
        case NM.VpnConnectionState.CONNECT: return 'connect';
        case NM.VpnConnectionState.IP_CONFIG_GET: return 'ip_config';
        case NM.VpnConnectionState.ACTIVATED: return 'activated';
        case NM.VpnConnectionState.FAILED: return 'failed';
        case NM.VpnConnectionState.DISCONNECTED:
        default: return 'disconnected';
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

        // Check if wifi is enabled first, since internet might be provided by
        // a wired network.
        if (!this.enabled)
            return 'network-wireless-offline-symbolic';

        if (this.internet === 'connected') {
            for (const [threshold, name] of iconNames) {
                if (this.strength >= threshold)
                    return `network-wireless-signal-${name}-symbolic`;
            }
        }

        if (this.internet === 'connecting')
            return 'network-wireless-acquiring-symbolic';

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

export type ActiveVpnConnection = null | NM.VpnConnection;

export class VpnConnection extends Service {
    static {
        Service.register(this, {}, {
            'id': ['string'],
            'state': ['string'],
            'vpn-state': ['string'],
            'icon-name': ['string'],
        });
    }

    private _vpn!: Vpn;
    private _connection!: NM.Connection;
    private _id!: string;
    private _activeConnection: ActiveVpnConnection = null;
    private _state: ReturnType<typeof _CONNECTION_STATE> = 'disconnected';
    private _stateBind: undefined | number = undefined;
    private _vpnState: ReturnType<typeof _VPN_CONNECTION_STATE> = 'disconnected';
    private _vpnStateBind: undefined | number = undefined;

    get connection() { return this._connection; }
    get active_connection() { return this._activeConnection; }
    get uuid() { return this._connection.get_uuid()!; }
    get id() { return this._connection.get_id() || ''; }
    get state() { return this._state; }
    get vpn_state() { return this._vpnState; }
    get icon_name() {
        switch (this._state) {
            case 'connected': return 'network-vpn-symbolic';
            case 'disconnected': return 'network-vpn-disabled-symbolic';
            case 'connecting':
            case 'disconnecting': return 'network-vpn-acquiring-symbolic';
        }
    }

    constructor(vpn: Vpn, connection: NM.RemoteConnection) {
        super();

        this._vpn = vpn;
        this._connection = connection;

        this._id = this._connection.get_id() || '';
        this._connection.connect('changed', () => this._updateId());
    }

    private _updateId() {
        const id = this._connection.get_id() || '';
        if (id !== this._id) {
            this._id = id;
            this.changed('id');
        }
    }

    private _updateState() {
        const state = _CONNECTION_STATE(this._activeConnection);
        if (state !== this._state) {
            this._state = state;
            this.notify('state');
            this.notify('icon-name');
            this.emit('changed');
        }
    }

    private _updateVpnState() {
        const vpnState = _VPN_CONNECTION_STATE(this._activeConnection);
        if (vpnState !== this._vpnState) {
            this._vpnState = vpnState;
            this.changed('vpn-state');
        }
    }

    readonly updateActiveConnection = (activeConnection: ActiveVpnConnection) => {
        if (this._activeConnection) {
            if (this._stateBind)
                this._activeConnection.disconnect(this._stateBind);

            if (this._vpnStateBind)
                this._activeConnection.disconnect(this._vpnStateBind);
        }

        this._activeConnection = activeConnection;
        this._stateBind = this._activeConnection?.connect(
            'notify::state',
            () => this._updateState(),
        );
        this._vpnStateBind = this._activeConnection?.connect(
            'notify::vpn-state',
            () => this._updateVpnState(),
        );

        this._updateState();
        this._updateVpnState();
    };

    readonly setConnection = (connect: boolean) => {
        if (connect) {
            if (this._state === 'disconnected')
                this._vpn.activateVpnConnection(this);
        }
        else {
            if (this._state === 'connected')
                this._vpn.deactivateVpnConnection(this);
        }
    };
}

export class Vpn extends Service {
    static {
        Service.register(this, {
            'connection-added': ['string'],
            'connection-removed': ['string'],
        }, {
            'connections': ['jsobject'],
            'activated-connections': ['jsobject'],
        });
    }

    private _client: NM.Client;
    private _connections: Map<string, VpnConnection>;

    constructor(client: NM.Client) {
        super();

        this._client = client;
        this._connections = new Map();

        bulkConnect(this._client as unknown as GObject.Object, [
            ['connection-added', this._connectionAdded.bind(this)],
            ['connection-removed', this._connectionRemoved.bind(this)],
        ]);

        this._client.get_connections().map((connection: NM.RemoteConnection) =>
            this._connectionAdded(this._client, connection));

        this._client.connect(
            'active-connection-added',
            (_: NM.Client, ac: NM.ActiveConnection) => {
                const uuid = ac.get_uuid();
                if (uuid && this._connections.has(uuid))
                    this._connections.get(uuid)?.updateActiveConnection(ac as ActiveVpnConnection);
            },
        );

        this._client.connect(
            'active-connection-removed',
            (_: NM.Client, ac: NM.ActiveConnection) => {
                const uuid = ac.get_uuid();
                if (uuid && this._connections.has(uuid))
                    this._connections.get(uuid)?.updateActiveConnection(null);
            },
        );
    }

    private _connectionAdded(client: NM.Client, connection: NM.RemoteConnection) {
        if (connection.get_connection_type() !== 'vpn' || connection.get_uuid() === null)
            return;

        const vpnConnection = new VpnConnection(this, connection);
        const activeConnection = client.get_active_connections()
            .find(ac => ac.get_uuid() === vpnConnection.uuid);

        if (activeConnection)
            vpnConnection.updateActiveConnection(activeConnection as NM.VpnConnection);

        vpnConnection.connect('changed', () => this.emit('changed'));
        vpnConnection.connect('notify::state', (c: VpnConnection) => {
            if (c.state === 'connected' || c.state === 'disconnected')
                this.changed('activated-connections');
        });

        this._connections.set(vpnConnection.uuid, vpnConnection);

        this.changed('connections');
        this.emit('connection-added', vpnConnection.uuid);
    }

    private _connectionRemoved(_: NM.Client, connection: NM.RemoteConnection) {
        const uuid = connection.get_uuid() || '';
        if (!uuid || !this._connections.has(uuid))
            return;

        this._connections.get(uuid)!.updateActiveConnection(null);
        this._connections.delete(uuid);

        this.notify('connections');
        this.notify('activated-connections');
        this.emit('changed');
        this.emit('connection-removed', uuid);
    }

    readonly activateVpnConnection = (vpn: VpnConnection) => {
        this._client.activate_connection_async(vpn.connection, null, null, null, null);
    };

    readonly deactivateVpnConnection = (vpn: VpnConnection) => {
        if (vpn.active_connection === null)
            return;

        this._client.deactivate_connection_async(vpn.active_connection, null, null);
    };

    readonly getConnection = (uuid: string) => this._connections.get(uuid);

    get connections() { return Array.from(this._connections.values()); }
    get activated_connections() {
        const list: VpnConnection[] = [];
        for (const [, connection] of this._connections) {
            if (connection.state === 'connected')
                list.push(connection);
        }
        return list;
    }
}

export class Network extends Service {
    static {
        Service.register(this, {}, {
            'wifi': ['jsobject'],
            'wired': ['jsobject'],
            'primary': ['string'],
            'connectivity': ['string'],
            'vpn': ['jsobject'],
        });
    }

    private _client!: NM.Client;

    wifi!: Wifi;
    wired!: Wired;
    primary: null | 'wifi' | 'wired' = null;
    connectivity!: string;
    vpn!: Vpn;

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
        const valid_devices = this._client
            .get_devices()
            .filter(device => device.get_device_type() === devType);

        return valid_devices.find(d => d.active_connection !== null) || valid_devices.at(0);
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

        this.vpn = new Vpn(this._client);

        this.wifi.connect('changed', this._sync.bind(this));
        this.wired.connect('changed', this._sync.bind(this));
        this.vpn.connect('changed', () => this.emit('changed'));

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
