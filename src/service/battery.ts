import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=3.0';
import Service from './service.js';
import { PowerManagerProxy, BatteryProxy } from '../dbus/upower.js';
import { timeout } from '../utils.js';

// from UPowerGlib
const DeviceState = {
    CHARGING: 1,
    FULLY_CHARGED: 4,
};

type BatteryState = {
    available: boolean
    percent: number
    charging: boolean
    charged: boolean
}

class BatteryService extends Service{
    static { Service.register(this); }

    _state!: BatteryState;
    _proxy: BatteryProxy;

    constructor(){
        super();

        this._state = {
            available: false,
            percent: -1,
            charging: false,
            charged: false,
        };

        this._proxy = new PowerManagerProxy(
            Gio.DBus.system,
            'org.freedesktop.UPower',
            '/org/freedesktop/UPower/devices/DisplayDevice') as BatteryProxy;

        this._proxy.connect('g-properties-changed', () => this._sync());

        timeout(100, this._sync.bind(this));
    }

    _sync(){
        if (!this._proxy.IsPresent)
            return;

        const percent = this._proxy.Percentage;
        const charging = this._proxy.State === DeviceState.CHARGING;
        const charged =
            this._proxy.State === DeviceState.FULLY_CHARGED ||
            (this._proxy.State === DeviceState.CHARGING && percent === 100);

        this._state = {
            available: true,
            percent,
            charging,
            charged,
        };

        this.emit('changed');
    }
}

export default class Battery {
    static { Service.export(this, 'Battery'); }
    static _instance: BatteryService;

    static connect(widget: Gtk.Widget, callback: () => void) {
        Service.ensureInstance(Battery, BatteryService);
        Battery._instance.listen(widget, callback);
    }

    static get state() {
        Service.ensureInstance(Battery, BatteryService);
        const state = { ...Battery._instance._state };
        return state;
    }
}
