import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import { loadInterfaceXML } from './utils.js';
import { type AgsProxy } from './dbus/types.js';

const AgsIFace = (bus: string) =>
    loadInterfaceXML('com.github.Aylur.ags')?.replace('@BUS@', bus);

const ClientIFace = (bus: string) =>
    loadInterfaceXML('com.github.Aylur.ags.client')?.replace('@BUS@', bus);

interface Flags {
    busName: string
    inspector: boolean
    runJs: string
    runPromise: string
    toggleWindow: string
    quit: boolean
}

class Client extends Gtk.Application {
    static { GObject.registerClass(this); }

    private _path: string;
    private _dbus!: Gio.DBusExportedObject;
    private _proxy: AgsProxy;
    private _promiseJs: string;

    constructor(bus: string, path: string, proxy: AgsProxy, js: string) {
        super({
            application_id: bus + '.client',
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._path = path + '/client';
        this._proxy = proxy;
        this._promiseJs = js;
    }

    private _register() {
        Gio.bus_own_name(
            Gio.BusType.SESSION,
            this.applicationId,
            Gio.BusNameOwnerFlags.NONE,
            (connection: Gio.DBusConnection) => {
                this._dbus = Gio.DBusExportedObject
                    .wrapJSObject(ClientIFace(this.applicationId) as string, this);

                this._dbus.export(connection, this._path);
            },
            null,
            null,
        );
    }

    Print(str: string) {
        print(str);
        this.quit();
        return str;
    }

    vfunc_activate(): void {
        this.hold();
        this._register();
        this._proxy.RunPromiseRemote(this._promiseJs, this.applicationId, this._path);
    }
}

export default function(bus: string, path: string, flags: Flags) {
    const AgsProxy = Gio.DBusProxy.makeProxyWrapper(AgsIFace(bus));
    const proxy = new AgsProxy(Gio.DBus.session, bus, path) as AgsProxy;

    if (flags.toggleWindow)
        print(proxy.ToggleWindowSync(flags.toggleWindow));

    else if (flags.runJs)
        print(proxy.RunJsSync(flags.runJs));

    else if (flags.inspector)
        proxy.InspectorRemote();

    else if (flags.quit)
        proxy.Quit();

    else if (flags.runPromise)
        return new Client(bus, path, proxy, flags.runPromise).run(null);

    else
        print(`Ags with busname "${flags.busName}" is already running`);
}
