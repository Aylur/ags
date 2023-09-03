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

class BatteryService extends Service {
    static { Service.register(this); }

    available = false;
    percent = -1;
    charging = false;
    charged = false;
    iconName = 'battery-missing-symbolic';
    private _proxy: BatteryProxy;


    constructor() {
        super();

        this._proxy = new PowerManagerProxy(
            Gio.DBus.system,
            'org.freedesktop.UPower',
            '/org/freedesktop/UPower/devices/DisplayDevice');

        this._proxy.connect('g-properties-changed', () => this._sync());

        timeout(100, this._sync.bind(this));
    }

    private _sync() {
        if (!this._proxy.IsPresent)
            return;

        const percent = this._proxy.Percentage;
        const charged =
            this._proxy.State === DeviceState.FULLY_CHARGED ||
            (this._proxy.State === DeviceState.CHARGING && percent === 100);

        const state = this._proxy.State ===
            DeviceState.CHARGING ? '-charging' : '';

        const level = Math.floor(percent / 10) * 10;
        this.iconName = charged
            ? 'battery-level-100-charged-symbolic'
            : `battery-level-${level}${state}-symbolic`;

        this.charging = this._proxy.State === DeviceState.CHARGING;
        this.percent = percent;
        this.charged = charged;
        this.available = true;

        this.emit('changed');
    }
}

export default class Battery {
    static _instance: BatteryService;

    static get instance() {
        Service.ensureInstance(Battery, BatteryService);
        return Battery._instance;
    }

    static get available() { return Battery.instance.available; }
    static get percent() { return Battery.instance.percent; }
    static get charging() { return Battery.instance.charging; }
    static get charged() { return Battery.instance.charged; }
    static get iconName() { return Battery.instance.iconName; }
}
