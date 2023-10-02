import Gio from 'gi://Gio';
import Service from '../service.js';
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

class Battery extends Service {
    static {
        Service.register(this, {
            'closed': [],
        }, {
            'available': ['boolean'],
            'percent': ['int'],
            'charging': ['boolean'],
            'charged': ['boolean'],
            'icon-name': ['string'],
        });
    }

    private _proxy: BatteryProxy;

    private _available = false;
    private _percent = -1;
    private _charging = false;
    private _charged = false;
    private _iconName = 'battery-missing-symbolic';

    get available() { return this._available; }
    get percent() { return this._percent; }
    get charging() { return this._charging; }
    get charged() { return this._charged; }
    get icon_name() { return this._iconName; }

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

        this.updateProperty('available', true);
        this.updateProperty('icon-name', iconName);
        this.updateProperty('percent', percent);
        this.updateProperty('charging', charging);
        this.updateProperty('charged', charged);
        this.emit('changed');
    }
}

export default new Battery();
