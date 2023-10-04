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
    static {
        Service.register(this, {
            'closed': [],
        }, {
            'available': ['boolean'],
            'percent': ['int'],
            'charging': ['boolean'],
            'charged': ['boolean'],
            'icon-name': ['string'],
            'time-remaining': ['float'],
            'energy': ['float'],
            'energy-full': ['float'],
            'energy-rate': ['float'],
        });
    }

    private _proxy: BatteryProxy;

    private _available = false;
    private _percent = -1;
    private _charging = false;
    private _charged = false;
    private _iconName = 'battery-missing-symbolic';
    private _timeRemaining = 0;
    private _energy = 0.0;
    private _energyFull = 0.0;
    private _energyRate = 0.0;

    get available() { return this._available; }
    get percent() { return this._percent; }
    get charging() { return this._charging; }
    get charged() { return this._charged; }
    get icon_name() { return this._iconName; }
    get time_remaining() { return this._timeRemaining; }
    get energy() { return this._energy; }
    get energy_full() { return this._energyFull; }
    get energy_rate() { return this._energyRate; }

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
            return this.updateProperty('available', false);

        const charging = this._proxy.State === DeviceState.CHARGING;
        const percent = this._proxy.Percentage;
        const charged =
            this._proxy.State === DeviceState.FULLY_CHARGED ||
            (this._proxy.State === DeviceState.CHARGING && percent === 100);

        const level = Math.floor(percent / 10) * 10;
        const state = this._proxy.State ===
            DeviceState.CHARGING ? '-charging' : '';

        const iconName = charged
            ? 'battery-level-100-charged-symbolic'
            : `battery-level-${level}${state}-symbolic`;

        const timeRemaining = charged ? this._proxy.TimeToFull : this._proxy.TimeToEmpty;

        const energy = this._proxy.Energy;

        const energyFull = this._proxy.EnergyFull;

        const energyRate = this._proxy.EnergyRate;

        this.updateProperty('available', true);
        this.updateProperty('icon-name', iconName);
        this.updateProperty('percent', percent);
        this.updateProperty('charging', charging);
        this.updateProperty('charged', charged);
        this.updateProperty('time-remaining', timeRemaining);
        this.updateProperty('energy', energy);
        this.updateProperty('energy-full', energyFull);
        this.updateProperty('energy-rate', energyRate);
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
    static get energy() { return Battery.instance.energy; }

    static get iconName() { return Battery.instance.icon_name; }
    static get icon_name() { return Battery.instance.icon_name; }
    static get ['icon-name']() { return Battery.instance.icon_name; }

    static get timeRemaining() { return Battery.instance.time_remaining; }
    static get time_remaining() { return Battery.instance.time_remaining; }
    static get ['time-remaining']() { return Battery.instance.time_remaining; }

    static get energyFull() { return Battery.instance.energy_full; }
    static get energy_full() { return Battery.instance.energy_full; }
    static get ['energy-full']() { return Battery.instance.energy_full; }

    static get energyRate() { return Battery.instance.energy_rate; }
    static get energy_rate() { return Battery.instance.energy_rate; }
    static get ['energy-rate']() { return Battery.instance.energy_rate; }
}
