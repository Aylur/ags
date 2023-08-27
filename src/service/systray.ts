import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import Dbusmenu from 'gi://Dbusmenu';
import Service from './service.js';
import { DBusProxy, TDBusProxy } from '../dbus/dbus.js';
import {
    StatusNotifierWatcherIFace,
    TStatusNotifierItemProxy,
    StatusNotifierItemProxy,
} from '../dbus/systray.js';
import { Icon, Label, Menu, MenuItem } from '../widget.js';
import { AgsMenu, AgsMenuItem } from '../widgets/menu.js';
import Gtk from 'gi://Gtk?version=3.0';

class SystemTrayService extends Service {
    static {
        Service.register(this);
    }

    _dbus!: Gio.DBusExportedObject;
    _items: Map<string, TStatusNotifierItemProxy>;
    _proxy: TDBusProxy;

    get IsStatusNotifierHostRegistered() {
        return true;
    }

    get ProtocolVersion() {
        return 0;
    }

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
        if (service.startsWith('/')) {
            objectPath = service;
            busName = invocation.get_sender();
        } else {
            busName = service;
            objectPath = '/StatusNotifierItem';
        }

        invocation.return_value(null);

        new StatusNotifierItemProxy(
            Gio.DBus.session,
            busName,
            objectPath,
            //TODO should probably be its own method for better readability
            (proxy: TStatusNotifierItemProxy, error: any) => {
                if (error === null) {
                    this._items.set(busName + objectPath, proxy);
                    proxy.AgsMenu = new AgsMenu({ children: [] });
                    proxy.DbusMenusClient = this._createMenu(proxy);
                    proxy.connect('g-signal', (
                        _proxy: TStatusNotifierItemProxy,
                        senderName: string,
                        signalName: string,
                        parameters: GLib.Variant<any>) => {
                        //TODO only refresh changed properties not all of them
                        if (signalName === 'NewTitle' ||
                            signalName === 'NewIcon' ||
                            signalName === 'NewToolTip' ||
                            signalName === 'NewStatus') {
                            this._refresh_properties(_proxy);
                            this.emit('changed');
                        }
                    });
                    this._dbus.emit_signal(
                        'StatusNotifierItemRegistered',
                        new GLib.Variant('(s)', [busName + objectPath]));
                    this.emit('changed');
                }
            },
            null, /* cancellable */
            Gio.DBusProxyFlags.NONE);
    }

    RegisterStatusNotifierHostAsync(
        serviceName: string, invocation: Gio.DBusMethodInvocation) {
        // TODO: Implement the logic to register a status notifier host
    }

    _refresh_properties(proxy: TStatusNotifierItemProxy) {
        const [properties] =
            (proxy.g_connection.call_sync(
                proxy.g_name,
                proxy.g_object_path,
                'org.freedesktop.DBus.Properties',
                'GetAll',
                GLib.Variant.new('(s)',
                    [proxy.g_interface_name]),
                GLib.VariantType.new('(a{sv})'),
                Gio.DBusCallFlags.NONE, -1,
                null) as GLib.Variant<'(a{sv})'>)
                .deep_unpack();
        Object.entries(properties).map(
            ([property_name, value]) => {
                this._update_property(proxy, property_name, value);
            });
    }

    _update_property(
        proxy: TStatusNotifierItemProxy,
        property_name: string,
        value :GLib.Variant<any>){
        proxy.set_cached_property(property_name, value);
        if (property_name === 'Menu' && proxy.Menu !== value.unpack()) {
            //new menu path, construct new proxy
            proxy.DbusMenusClient = this._createMenu(proxy);
        }
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

    _createMenu(item: TStatusNotifierItemProxy) {
        const menu = new Dbusmenu.Client(
            { dbus_name: item.g_name_owner, dbus_object: item.Menu });
        menu.connect('layout-updated', (
            client: Dbusmenu.Client) => {
            const menu_items = this._createRootMenu(menu, client.get_root());
            item.AgsMenu.children = menu_items;
        });
        return menu;
    }

    _createRootMenu(client: Dbusmenu.Client, dbusMenuItem: Dbusmenu.Menuitem) {
        if (!dbusMenuItem ||
            dbusMenuItem.property_get('children-display') !== 'submenu')
            return [];
        const menu_items: Gtk.Widget[] = [];
        dbusMenuItem.get_children().forEach(dbitem =>
            menu_items.push(this._createItem(client, dbitem)));
        return menu_items;
    }

    _createItem(client: Dbusmenu.Client, dbusMenuItem: Dbusmenu.Menuitem) {
        let menuItem;
        if (dbusMenuItem.property_get('children-display') === 'submenu') {
            menuItem = MenuItem({
                child: Label({ label: dbusMenuItem.property_get('label') }),
            }) as AgsMenuItem;
            const submenu = new AgsMenu({ children: [] });
            dbusMenuItem.get_children().forEach(dbitem =>
                submenu.add(this._createItem(client, dbitem)));
            menuItem.set_submenu(submenu);
            menuItem.set_use_underline(true);
        } else if (dbusMenuItem.property_get('type') === 'separator') {
            menuItem = new Gtk.SeparatorMenuItem();
        } else {
            menuItem = MenuItem({
                onActivate: (item: AgsMenuItem) => {
                    dbusMenuItem.handle_event(
                        'clicked',
                        // @ts-ignore
                        GLib.Variant.new('i', 0),
                        Gtk.get_current_event_time());
                },
                child: Label({ label: dbusMenuItem.property_get('label') }),
            }) as AgsMenuItem;
            menuItem.set_use_underline(true);
        }
        return menuItem;
    }

    get_pixbuf(pixMapArray:  [number, number, Uint8Array][], iconSize: number) {
        //TODO instead of getting the first provided pixmap,
        // it would be better to get the smallest pixmap
        // that is larger than the target size
        const pixMap = pixMapArray[0];
        const pixbuf = GdkPixbuf.Pixbuf.new_from_bytes(
            pixMap[2],
            GdkPixbuf.Colorspace.RGB,
            true,
            8,
            pixMap[0],
            pixMap[1],
            pixMap[0] * 4);
        const scale_pixbuf = pixbuf.scale_simple(
            iconSize,
            iconSize,
            GdkPixbuf.InterpType.BILINEAR);
        if (!scale_pixbuf)
            return;
        return scale_pixbuf;
    }

    get_icon(item: TStatusNotifierItemProxy, iconSize: number){
        if (item.Status === 'NeedsAttention') {
            return item.AttentionIconName ?
                Icon({ icon: item.AttentionIconName }) :
                Gtk.Image.new_from_pixbuf(
                    this.get_pixbuf(item.AttentionIconPixmap, iconSize));
        }
        else {
            return item.IconName ?
                Icon({ icon: item.IconName }) :
                Gtk.Image.new_from_pixbuf(
                    this.get_pixbuf(item.IconPixmap, iconSize));
        }
    }

    get_tooltip_markup(item: TStatusNotifierItemProxy){
        let tooltip_markup = item.ToolTip[2];
        if (item.ToolTip[3] !== '')
            tooltip_markup += '\n' + item.ToolTip[3];
        return tooltip_markup;
    }
}


export default class SystemTray {
    static {
        Service.export(this, 'SystemTray');
    }

    static _instance: SystemTrayService;

    static get instance() {
        Service.ensureInstance(SystemTray, SystemTrayService);
        return SystemTray._instance;
    }

    static get items() {
        return Array.from(SystemTray.instance._items.values());
    }

    static get_icon(item :TStatusNotifierItemProxy, iconSize: number){
        return SystemTray.instance.get_icon(item, iconSize);
    }

    static get_tooltip_markup(item: TStatusNotifierItemProxy){
        return SystemTray.instance.get_tooltip_markup(item);
    }
}
