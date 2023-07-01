// @ts-nocheck
import Gtk from 'gi://Gtk?version=3.0';
import Service from './service.js';

// I don't know yet how to import it without compiling
// import NM from '@girs/nm-1.0';
imports.gi.versions.NM = '1.0';
const { NM } = imports.gi;

type Internet = 'connected'|'connecting'|'disconnected';
type DeviceState = 'disabled'|'enabled'|'unknown';
type Connectivity = 'unknown'|'none'|'portal'|'limited'|'full';

function _CONNECTIVITY(state: NM.ConnectivityState): Connectivity {
    switch (state) {
    case NM.ConnectivityState.UNKNOWN: return 'unknown';
    case NM.ConnectivityState.NONE: return 'none';
    case NM.ConnectivityState.PORTAL: return 'portal';
    case NM.ConnectivityState.LIMITED: return 'limited';
    case NM.ConnectivityState.FULL: return 'full';
    }
}

function _INTERNET(state: NM.ActiveConnection): Internet {
    switch (state?.state) {
    case NM.ActiveConnectionState.ACTIVATED: return 'connected';
    case NM.ActiveConnectionState.ACTIVATING: return 'connecting';
    default: return 'disconnected';
    }
}

function _STATE(state: NM.DeviceState): DeviceState {
    switch (state) {
    case NM.DeviceState.DISCONNECTED:
    case NM.DeviceState.UNAVAILABLE: return 'disabled';
    case NM.DeviceState.ACTIVATED: return 'enabled';
    default: return 'unknown';
    }
}

type WifiState = {
    ssid: string
    strength: number
    internet: Internet
    enabled: boolean
}

type WiredState = {
    internet: Internet
    state: DeviceState
}

type NetworkState = {
    connectivity: Connectivity
    primary: string
    wifi: WifiState
    wired: WiredState
}

class NetworkService extends Service{
    static { Service.register(this); }

    _state!: NetworkState;
    _client!: NM.Client;
    _wifi!: NM.DeviceWifi;
    _wired!: NM.DeviceEthernet;
    _ap?: NM.AccessPoint;
    _apBind!: number;

    constructor() {
        super();

        this._state = {
            connectivity: 'unknown',
            primary: '',
            wifi: {
                ssid: 'Unknown',
                strength: -1,
                internet: 'disconnected',
                enabled: false,
            },
            wired: {
                internet: 'disconnected',
                state: 'unknown',
            },
        };
        NM.Client.new_async(null, (_s, result) => {
            try {
                this._client = NM.Client.new_finish(result);
                this._clientReady();
            }
            catch (e) {
                logError(e as Error);
            }
        });
    }

    toggleWifi() {
        this._client.wireless_enabled = !this._client.wireless_enabled;
    }

    _getDevice(devType: NM.DeviceType) {
        return this._client
            .get_devices()
            .find(device => device.get_device_type() === devType);
    }

    _clientReady() {
        this._client.connect('notify::wireless-enabled',      this._sync.bind(this));
        this._client.connect('notify::connectivity',          this._sync.bind(this));
        this._client.connect('notify::primary-connection',    this._sync.bind(this));
        this._client.connect('notify::activating-connection', this._sync.bind(this));

        this._wifi = this._getDevice(NM.DeviceType.WIFI) as NM.DeviceWifi;
        if (this._wifi)
            this._wifi.connect('notify::active-access-point', this._activeAp.bind(this));
            // this._wifi.connect('access-point-added', (_, ap) => this._apAdded(ap));
            // this._wifi.connect('access-point-removed', (_, ap) => this._apRemoved(ap));

        this._wired = this._getDevice(NM.DeviceType.ETHERNET) as NM.DeviceEthernet;

        this._activeAp();
        this._sync();
    }

    // _apAdded(_ap) {
    //     //TODO
    // }
    //
    // _apRemoved(_ap) {
    //     //TODO
    // }

    _activeAp() {
        if (this._ap)
            this._ap.disconnect(this._apBind);

        this._ap = this._wifi?.get_active_access_point();

        if (!this._ap)
            return;

        this._apBind = this._ap.connect('notify::strength', this._sync.bind(this));
        this._sync();
    }

    _sync() {
        const mainConnection =
            this._client.get_primary_connection() ||
            this._client.get_activating_connection();

        const primary = mainConnection?.type || 'unknown'; // 802-11-wireless ; 802-3-ethernet

        this._state = {
            connectivity: _CONNECTIVITY(this._client.connectivity),
            primary: {
                '802-11-wireless': 'wifi',
                '802-3-ethernet': 'wired',
            }[primary] || '',
            wifi: {
                ssid: this._ap && NM.utils_ssid_to_utf8(
                    this._ap.get_ssid().get_data() || new Uint8Array()) || 'Unknown',
                strength: this._ap?.strength || -1,
                internet: _INTERNET(this._wifi.active_connection),
                enabled: this._client.wireless_enabled,
            },
            wired: {
                internet: _INTERNET(this._wired.active_connection),
                state: _STATE(this._wired?.state),
            },
        };

        this.emit('changed');
    }
}

export default class Network {
    static { Service.export(this, 'Network'); }
    static _instance: NetworkService;

    static disconnect(id: number) { Network._instance.disconnect(id); }
    static connect(widget: Gtk.Widget, callback: () => void) {
        Service.ensureInstance(Network, NetworkService);
        Network._instance.listen(widget, callback);
    }

    static toggleWifi() {
        Service.ensureInstance(Network, NetworkService);
        Network._instance.toggleWifi();
    }

    static get connectivity() {
        Service.ensureInstance(Network, NetworkService);
        return Network._instance._state.connectivity;
    }

    static get primary() {
        Service.ensureInstance(Network, NetworkService);
        return Network._instance._state.primary;
    }

    static get wifi() {
        Service.ensureInstance(Network, NetworkService);
        return Network._instance._state.wifi;
    }

    static get wired() {
        Service.ensureInstance(Network, NetworkService);
        return Network._instance._state.wired;
    }
}
