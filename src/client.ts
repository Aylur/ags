import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { loadInterfaceXML } from './utils.js';
import { type AgsProxy } from './dbus/types.js';

const AgsIFace = (bus: string) =>
    loadInterfaceXML('com.github.Aylur.ags')!.replace('@BUS@', bus);

const ClientIFace = (bus: string) =>
    loadInterfaceXML('com.github.Aylur.ags.client')!.replace('@BUS@', bus);

const TIME = `${GLib.DateTime.new_now_local().to_unix()}`;

interface Flags {
    busName: string
    inspector: boolean
    runJs: string
    runFile: string
    toggleWindow: string
    quit: boolean

    // FIXME: deprecated
    runPromise: string
}

class Client extends Gtk.Application {
    static { GObject.registerClass(this); }

    private _objectPath: string;
    private _dbus!: Gio.DBusExportedObject;
    private _proxy: AgsProxy;
    private _callback!: () => void;

    constructor(bus: string, path: string, proxy: AgsProxy) {
        super({
            application_id: bus + '.client' + TIME,
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._objectPath = path + '/client' + TIME;
        this._proxy = proxy;
    }

    private _register() {
        Gio.bus_own_name(
            Gio.BusType.SESSION,
            this.application_id!,
            Gio.BusNameOwnerFlags.NONE,
            (connection: Gio.DBusConnection) => {
                this._dbus = Gio.DBusExportedObject
                    .wrapJSObject(ClientIFace(this.application_id!) as string, this);

                this._dbus.export(connection, this._objectPath);
            },
            null,
            null,
        );
    }

    Return(str: string) {
        print(str);
        this.quit();
    }

    Print(str: string) {
        print(str);
    }

    // FIXME: promise deprecated
    remote(method: 'Js' | 'Promise' | 'File', body: string) {
        if (method === 'Promise') {
            console.warn('--run-promise is DEPRECATED, ' +
                ' use --run-js instead, which now supports await syntax');
        }

        this._callback = () => this._proxy[`Run${method}Remote`](
            body,
            this.application_id!,
            this._objectPath,
        );
        this.run(null);
    }

    vfunc_activate(): void {
        this.hold();
        this._register();
        this._callback();
    }
}

export default function(bus: string, path: string, flags: Flags) {
    const AgsProxy = Gio.DBusProxy.makeProxyWrapper(AgsIFace(bus));
    const proxy = AgsProxy(Gio.DBus.session, bus, path) as AgsProxy;
    const client = new Client(bus, path, proxy);

    if (flags.toggleWindow)
        print(proxy.ToggleWindowSync(flags.toggleWindow));

    else if (flags.runJs)
        client.remote('Js', flags.runJs);

    else if (flags.runFile)
        client.remote('File', flags.runFile);

    else if (flags.inspector)
        proxy.InspectorRemote();

    else if (flags.quit)
        proxy.QuitRemote();

    // FIXME: deprecated
    else if (flags.runPromise)
        client.remote('Promise', flags.runPromise);

    else
        print(`Ags with busname "${flags.busName}" is already running`);
}
