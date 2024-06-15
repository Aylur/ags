import Gio from 'gi://Gio';
import Service from '../service.js';
import { loadInterfaceXML } from "../utils.js";

const StatusDbusIFace = loadInterfaceXML('com.github.Aylur.ags.status')!;


export class StatusDbus extends Service {
  static {
    Service.register(this, {
      'status_changed': ['string'],
    },
    )
  };

  private _status = '';
  private _dbus!: Gio.DBusExportedObject;

  get status() { return this._status; }

  constructor() {
    super();
    this._register();
  }

  private _register() {
    Gio.bus_own_name(
      Gio.BusType.SESSION,
      'com.github.Aylur.ags.status',
      Gio.BusNameOwnerFlags.NONE,
      (connection: Gio.DBusConnection) => {
        this._dbus = Gio.DBusExportedObject
          .wrapJSObject(StatusDbusIFace as string, this);
        this._dbus.export(connection, '/com/github/Aylur/ags/status');
      },
      null,
      null,
    )

  }

  Set(status: string) {
    this._status = status;
    this.emit('status_changed', status);
  }
}

export const statusDbus = new StatusDbus;
export default statusDbus;
