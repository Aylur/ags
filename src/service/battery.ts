import Gio from 'gi://Gio';
import Service from './service.js';
import { timeout } from '../utils.js';
import { loadInterfaceXML } from '../utils.js';
import { type BatteryProxy } from '../dbus/types.js';

const BatteryIFace = loadInterfaceXML('org.freedesktop.UPower.Device');
const PowerManagerProxy =
    Gio.DBusProxy.makeProxyWrapper(BatteryIFace) as BatteryProxy;

const DeviceState = {
    CHARGING: 1,
    FULLY_CHARGED: 4,
};

type BatteryState = {
    available: boolean
    percent: number
    charging: boolean
    charged: boolean
    iconName: string
}

class BatteryService extends Service {
    static { Service.register(this); }

    _state!: BatteryState;
    _proxy: BatteryProxy;

    constructor() {
        super();

        this._state = {
            available: false,
            percent: -1,
            charging: false,
            charged: false,
            iconName: 'battery-missing-symbolic',
        };

        this._proxy = new PowerManagerProxy(
            Gio.DBus.system,
            'org.freedesktop.UPower',
            '/org/freedesktop/UPower/devices/DisplayDevice');

        this._proxy.connect('g-properties-changed', () => this._sync());

        timeout(100, this._sync.bind(this));
    }

    _sync() {
        if (!this._proxy.IsPresent)
            return;

        const percent = this._proxy.Percentage;
        const charging = this._proxy.State === DeviceState.CHARGING;
        const charged =
            this._proxy.State === DeviceState.FULLY_CHARGED ||
            (this._proxy.State === DeviceState.CHARGING && percent === 100);

        const state = this._proxy.State ===
            DeviceState.CHARGING ? '-charging' : '';

        const level = Math.floor(percent / 10) * 10;
        const iconName = charged
            ? 'battery-level-100-charged-symbolic'
            : `battery-level-${level}${state}-symbolic`;

        this._state = {
            available: true,
            percent,
            charging,
            charged,
            iconName,
        };

        this.emit('changed');
    }
}

export default class Battery {
    static { Service.export(this, 'Battery'); }
    static _instance: BatteryService;

    static get instance() {
        Service.ensureInstance(Battery, BatteryService);
        return Battery._instance;
    }

    static get available() { return Battery.instance._state.available; }
    static get percent() { return Battery.instance._state.percent; }
    static get charging() { return Battery.instance._state.charging; }
    static get charged() { return Battery.instance._state.charged; }
    static get iconName() { return Battery.instance._state.iconName; }
}
