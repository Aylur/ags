import Gtk from 'gi://Gtk?version=3.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

interface Flags {
    busName: string
    inspector: boolean
    runJs: string
    toggleWindow: string
    quit: boolean
}

export default class Client extends Gtk.Application {
    static { GObject.registerClass(this); }

    private _flags: Flags;
    private _actionGroup: Gio.DBusActionGroup;

    constructor(bus: string, path: string, flags: Flags) {
        super({
            application_id: bus + '.client',
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        this._flags = flags;
        this._actionGroup = Gio.DBusActionGroup
            .get(Gio.DBus.session, bus, path);

        const action = new Gio.SimpleAction({
            name: 'print',
            parameter_type: new GLib.VariantType('s'),
        });
        action.connect('activate', (_, returnValue) => {
            print(returnValue?.unpack() as string || '');
            this.quit();
        });
        this.add_action(action);
    }

    vfunc_activate() {
        const { toggleWindow, runJs, inspector, quit } = this._flags;
        if (toggleWindow) {
            this.hold();
            this._actionGroup.activate_action('toggle-window',
                new GLib.Variant('s', toggleWindow));
        }

        if (runJs) {
            this.hold();
            this._actionGroup.activate_action('run-js',
                new GLib.Variant('s', runJs));
        }

        if (inspector)
            this._actionGroup.activate_action('inspector', null);

        if (quit)
            this._actionGroup.activate_action('quit', null);

        if (!toggleWindow && !runJs && !inspector && !quit) {
            print('Ags with busname "' +
                this._flags.busName +
                '" is already running');
        }
    }
}
