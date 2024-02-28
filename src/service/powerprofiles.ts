import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from '../service.js';
import { loadInterfaceXML } from '../utils.js';
import { PowerProfilesProxy } from '../dbus/types.js';
import { kebabify } from '../utils/gobject.js';
import { isRunning } from '../utils/init.js';

const BUSNAME = 'net.hadess.PowerProfiles';
const PowerProfilesIFace = loadInterfaceXML(BUSNAME)!;
const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(
    PowerProfilesIFace) as unknown as PowerProfilesProxy;

const DummyProxy = {
    ActiveProfile: '',
    PerformanceInhibited: '',
    PerformanceDegraded: '',
    Profiles: [],
    Actions: [],
    ActiveProfileHolds: [],
    HoldProfile: () => 0,
    ReleaseProfile: () => null,
} as unknown as PowerProfilesProxy;

class PowerProfiles extends Service {
    static {
        Service.register(this, {
            'profile-released': ['int'],
        }, {
            'active-profile': ['string', 'rw'],
            'performance-inhibited': ['string', 'r'],
            'performance-degraded': ['string', 'r'],
            'profiles': ['jsobject', 'r'],
            'actions': ['jsobject', 'r'],
            'active-profile-holds': ['jsobject', 'r'],
            'icon-name': ['string', 'r'],
        });
    }

    private _proxy = DummyProxy;
    private _unpackDict(dict: { [prop: string]: GLib.Variant }) {
        const data: { [key: string]: string } = {};
        for (const [key, variant] of Object.entries(dict))
            data[key] = variant.unpack();

        return data;
    }

    constructor() {
        super();

        if (isRunning(BUSNAME, 'system')) {
            this._proxy = new PowerProfilesProxy(
                Gio.DBus.system,
                'net.hadess.PowerProfiles',
                '/net/hadess/PowerProfiles');

            this._proxy.connect('g-properties-changed', (_, changed) => {
                for (const prop of Object.keys(changed.deepUnpack())) {
                    this.notify(kebabify(prop));
                    if (prop === 'ActiveProfile')
                        this.notify('icon-name');
                }

                this.emit('changed');
            });

            this._proxy.connectSignal('ProfileReleased', (_p, _n, [cookie]) => {
                this.emit('profile-released', cookie);
            });
        } else {
            console.error(`${BUSNAME} is not available`);
        }
    }

    get active_profile() { return this._proxy.ActiveProfile; }
    set active_profile(profile: string) { this._proxy.ActiveProfile = profile; }

    get performance_inhibited() { return this._proxy.PerformanceInhibited; }
    get performance_degraded() { return this._proxy.PerformanceDegraded; }
    get profiles() { return this._proxy.Profiles.map(this._unpackDict); }
    get actions() { return this._proxy.Actions; }
    get active_profile_holds() { return this._proxy.ActiveProfileHolds.map(this._unpackDict); }
    get icon_name() { return `power-profile-${this.active_profile}-symbolic`; }
}

const service = new PowerProfiles;
export default service;
