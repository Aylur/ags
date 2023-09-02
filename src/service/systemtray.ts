import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk?version=3.0';
import GdkPixbuf from 'gi://GdkPixbuf';
import Dbusmenu from 'gi://Dbusmenu';
import Service from './service.js';
import { StatusNotifierItemProxy } from '../dbus/types.js';
import { AgsMenu, AgsMenuItem } from '../widgets/menu.js';
import { bulkConnect, loadInterfaceXML } from '../utils.js';
import AgsLabel from '../widgets/label.js';

const StatusNotifierWatcherIFace = loadInterfaceXML('org.kde.StatusNotifierWatcher');
const StatusNotifierItemIFace = loadInterfaceXML('org.kde.StatusNotifierItem');
const StatusNotifierItemProxy =
    Gio.DBusProxy.makeProxyWrapper(StatusNotifierItemIFace) as StatusNotifierItemProxy;

export class TrayItem extends Service {
    static {
        Service.register(this, {
            'removed': ['string'],
            'layout-changed': [],
        });
    }

    private _proxy: StatusNotifierItemProxy;

    constructor(busName: string, objectPath: string) {
        super();

        this.busName = busName;
        this.objectPath = objectPath;

        this._proxy = new StatusNotifierItemProxy(
            Gio.DBus.session,
            busName,
            objectPath,
            this._itemProxyAcquired.bind(this),
            null,
            Gio.DBusProxyFlags.NONE);
    }

    menu = new AgsMenu();

    activate(event: Gdk.Event) {
        this._proxy.ActivateAsync(event.get_root_coords()[1], event.get_root_coords()[2]);
    }

    openMenu(event: Gdk.Event) {
        this.menu
            ? this.menu.popup_at_pointer(event)
            : this._proxy.ContextMenuAsync(event.get_root_coords()[1], event.get_root_coords()[2]);
    }

    dbusMenusClient!: Dbusmenu.Client;
    busName: string;
    objectPath: string;

    get category() { return this._proxy.Category; }
    get id() { return this._proxy.Id; }
    get title() { return this._proxy.Title; }
    get status() { return this._proxy.Status; }
    get windowId() { return this._proxy.WindowId; }
    get itemIsMenu() { return this._proxy.ItemIsMenu; }
    get tooltipMarkup() {
        if (!this._proxy.ToolTip)
            return '';

        let tooltipMarkup = this._proxy.ToolTip[2];
        if (this._proxy.ToolTip[3] !== '')
            tooltipMarkup += '\n' + this._proxy.ToolTip[3];
        return tooltipMarkup;
    }

    get icon() {
        let icon;
        if (this.status === 'NeedsAttention') {
            icon = this._proxy.AttentionIconName
                ? this._proxy.AttentionIconName
                : this._getPixbuf(this._proxy.AttentionIconPixmap);
        }
        else {
            icon = this._proxy.IconName
                ? this._proxy.IconName
                : this._getPixbuf(this._proxy.IconPixmap);
        }

        return icon || 'image-missing';
    }

    private _itemProxyAcquired(proxy: StatusNotifierItemProxy, error: Error) {
        if (error) {
            logError(error as Error);
            return;
        }

        if (proxy.Menu)
            this._createMenuClient(proxy);

        bulkConnect(proxy, [
            ['g-signal', () => {
                this._refreshAllProperties();
                this.emit('changed');
            }],
            ['notify::g-name-owner', () => {
                if (!this._proxy.g_name_owner)
                    this.emit('removed', this.busName);
            }],
            ['g-properties-changed', () => this.emit('changed')],
        ]);

        this.emit('changed');
    }

    private _refreshAllProperties() {
        const variant = this._proxy.g_connection.call_sync(
            this._proxy.g_name,
            this._proxy.g_object_path,
            'org.freedesktop.DBus.Properties',
            'GetAll',
            GLib.Variant.new('(s)', [this._proxy.g_interface_name]),
            GLib.VariantType.new('(a{sv})'),
            Gio.DBusCallFlags.NONE, -1,
            null,
        ) as GLib.Variant<'(a{sv})'>;

        const [properties] = variant.deep_unpack();

        Object.entries(properties).map(([propertyName, value]) => {
            this._updateProperty(propertyName, value);
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _updateProperty(propertyName: string, value: GLib.Variant<any>) {
        this._proxy.set_cached_property(propertyName, value);
        if (propertyName === 'Menu' && this._proxy.Menu !== value.unpack()) {
            // new menu path, construct new proxy
            this._createMenuClient(this._proxy);
        }
    }

    private _createMenuClient(item: StatusNotifierItemProxy) {
        this.dbusMenusClient = new Dbusmenu.Client({
            dbus_name: item.g_name_owner, dbus_object: item.Menu,
        });
        this.dbusMenusClient.connect('layout-updated', () => {
            const dbusMenuItem = this.dbusMenusClient.get_root();
            if (!dbusMenuItem || dbusMenuItem.property_get('children-display') !== 'submenu')
                return;

            this.emit('layout-changed');
            this.menu.children = dbusMenuItem.get_children()
                .map(item => this._createItem(item));
        });
    }

    private _createItem(dbusMenuItem: Dbusmenu.Menuitem): Gtk.MenuItem {
        if (dbusMenuItem.property_get('children-display') === 'submenu') {
            return new AgsMenuItem({
                child: new AgsLabel(dbusMenuItem.property_get('label') || ''),
                useUnderline: true,
                submenu: new AgsMenu({
                    children: dbusMenuItem.get_children().map(item =>
                        this._createItem(item)),
                }),
            });
        }
        else if (dbusMenuItem.property_get('type') === 'separator') {
            return new Gtk.SeparatorMenuItem();
        }
        else {
            return new AgsMenuItem({
                onActivate: () => dbusMenuItem.handle_event(
                    'clicked',
                    // @ts-ignore
                    GLib.Variant.new('i', 0),
                    Gtk.get_current_event_time(),
                ),
                child: new AgsLabel(dbusMenuItem.property_get('label') || ''),
                useUnderline: true,
            });
        }
    }

    private _getPixbuf(pixMapArray: [number, number, Uint8Array][]) {
        if (!pixMapArray)
            return;

        const pixMap = pixMapArray.sort((a, b) => a[0] - b[0]).pop();
        if (!pixMap)
            return;

        const array = Uint8Array.from(pixMap[2]);
        for (let i = 0; i < 4 * pixMap[0] * pixMap[1]; i += 4) {
            const alpha = array[i];
            array[i] = array[i + 1];
            array[i + 1] = array[i + 2];
            array[i + 2] = array[i + 3];
            array[i + 3] = alpha;
        }
        return GdkPixbuf.Pixbuf.new_from_bytes(
            array,
            GdkPixbuf.Colorspace.RGB,
            true,
            8,
            pixMap[0],
            pixMap[1],
            pixMap[0] * 4,
        );
    }
}

class SystemTrayService extends Service {
    static {
        Service.register(this, {
            'added': ['string'],
            'removed': ['string'],
        });
    }

    private _dbus!: Gio.DBusExportedObject;
    private _items: Map<string, TrayItem>;

    get IsStatusNotifierHostRegistered() { return true; }
    get ProtocolVersion() { return 0; }
    get RegisteredStatusNotifierItems() { return Array.from(this._items.keys()); }
    get items() { return this._items; }

    constructor() {
        super();
        this._items = new Map();
        this._register();
    }

    private _register() {
        Gio.bus_own_name(
            Gio.BusType.SESSION,
            'org.kde.StatusNotifierWatcher',
            Gio.BusNameOwnerFlags.NONE,
            (connection: Gio.DBusConnection) => {
                this._dbus = Gio.DBusExportedObject
                    .wrapJSObject(StatusNotifierWatcherIFace as string, this);

                this._dbus.export(connection, '/StatusNotifierWatcher');
            },
            null,
            () => {
                print('Another system tray is already running');
            },
        );
    }

    RegisterStatusNotifierItemAsync(serviceName: string[], invocation: Gio.DBusMethodInvocation) {
        let busName: string, objectPath: string;
        const [service] = serviceName;
        if (service.startsWith('/')) {
            objectPath = service;
            busName = invocation.get_sender();
        } else {
            busName = service;
            objectPath = '/StatusNotifierItem';
        }

        invocation.return_value(null);

        const trayIcon = new TrayItem(busName, objectPath);
        this._items.set(busName, trayIcon);

        this._dbus.emit_signal(
            'StatusNotifierItemRegistered',
            new GLib.Variant('(s)', [busName + objectPath]),
        );
        this.emit('added', busName);
        this.emit('changed');

        trayIcon.connect('removed', () => {
            this._items.delete(busName);
            this.emit('removed', busName);
            this.emit('changed');
            this._dbus.emit_signal(
                'StatusNotifierItemUnregistered',
                new GLib.Variant('(s)', [busName]),
            );
        });
    }

    getItem(name: string) {
        return this._items.get(name);
    }
}


export default class SystemTray {
    static { Service.export(this, 'SystemTray'); }
    static _instance: SystemTrayService;

    static get instance() {
        Service.ensureInstance(SystemTray, SystemTrayService);
        return SystemTray._instance;
    }

    static get items() { return Array.from(SystemTray.instance.items.values()); }
    static getItem(name: string) { return SystemTray._instance.getItem(name); }
}
