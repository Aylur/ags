import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Service from './service.js';
import { DBusProxy, TDBusProxy } from '../dbus/dbus.js';
import { StatusNotifierWatcherIFace,
    TStatusNotifierItemProxy,
    StatusNotifierItemProxy } from '../dbus/systray.js';

class SystemTrayService extends Service {
    static {
        Service.register(this);
    }

    _dbus!: Gio.DBusExportedObject;
    _items: Map<string, TStatusNotifierItemProxy>;
    _proxy: TDBusProxy;
    get IsStatusNotifierHostRegistered() { return true; }
    get ProtocolVersion() { return 0; }
    get RegisteredStatusNotifierItems() {
        return Array.from(this._items.keys());
    }

    constructor() {
        super();
        this._items = new Map();
        this._register();
        this._proxy = new DBusProxy(Gio.DBus.session,
            'org.freedesktop.DBus',
            '/org/freedesktop/DBus');
        this._proxy.connectSignal('NameOwnerChanged',
            this._onNameOwnerChanged.bind(this));
    }

    _register() {
        Gio.bus_own_name(
            Gio.BusType.SESSION,
            'org.kde.StatusNotifierWatcher',
            Gio.BusNameOwnerFlags.NONE,
            (connection: Gio.DBusConnection) => {
                this._dbus = Gio.DBusExportedObject
                    .wrapJSObject(StatusNotifierWatcherIFace, this);

                this._dbus.export(connection, '/StatusNotifierWatcher');
            },
            null,
            () => {
                print('Another system tray is already running');
            },
        );
    }

    RegisterStatusNotifierItemAsync(
        serviceName: string, invocation: Gio.DBusMethodInvocation) {
        let busName: string, objectPath: string;
        const [service] = serviceName;
        if (service.startsWith('/')){
            objectPath = service;
            busName = invocation.get_sender();
        }
        else {
            busName = service;
            objectPath = '/StatusNotifierItem';
        }
        new Promise(() => {
            new StatusNotifierItemProxy(
                Gio.DBus.session,
                busName,
                objectPath,
                (proxy: TStatusNotifierItemProxy, error: any) => {
                    if (error === null) {
                        this._items.set(busName+objectPath, proxy);
                        this._dbus.emit_signal(
                            'StatusNotifierItemRegistered',
                            new GLib.Variant('(s)', [busName+objectPath]));
                        this.emit('changed');
                    }
                },
                null, /* cancellable */
                Gio.DBusProxyFlags.NONE);
        }).catch(e => logError(e));
        invocation.return_value(null);
    }

    RegisterStatusNotifierHostAsync(
        serviceName: string, invocation: Gio.DBusMethodInvocation) {
        // TODO: Implement the logic to register a status notifier host
    }

    _onNameOwnerChanged(
        _proxy: string,
        _sender: string,
        [name, oldOwner, newOwner]: string[],
    ) {
        if (!newOwner && oldOwner) {
            const key = Array.from(
                this._items.keys()).find(key => key.startsWith(oldOwner));
            if (!key)
                return;
            this._items.delete(key);
            this._dbus.emit_signal(
                'StatusNotifierItemUnregistered',
                new GLib.Variant('(s)', [key]));
            this.emit('changed');
        }
    }
}


export default class SystemTray {
    static { Service.export(this, 'SystemTray'); }
    static _instance: SystemTrayService;

    static get instance() {
        Service.ensureInstance(SystemTray, SystemTrayService);
        return SystemTray._instance;
    }

    static get items() {
        return Array.from(SystemTray.instance._items.values());
    }
}
