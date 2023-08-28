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
import { Label, MenuItem } from '../widget.js';
import { AgsMenu, AgsMenuItem } from '../widgets/menu.js';
import Gtk from 'gi://Gtk?version=3.0';
import AgsIcon from '../widgets/icon.js';
import { ParamSpec } from 'gobject2';

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
            this._item_proxy_acquired.bind(this),
            null,
            Gio.DBusProxyFlags.NONE);
    }

    _item_proxy_acquired(proxy: TStatusNotifierItemProxy, error: any) {
        if (error !== null)
            return;
        const busName = proxy.g_name_owner;
        const objectPath = proxy.g_object_path;
        this._items.set(busName + objectPath, proxy);
        proxy.AgsMenu = new AgsMenu({ children: [] });
        if (proxy.Menu)
            proxy.DbusMenusClient = this._createMenu(proxy);
        proxy.connect('g-signal', this._on_item_signal.bind(this));
        proxy.connect('notify::g-name-owner',
            (_proxy: TStatusNotifierItemProxy, params: ParamSpec) => {
                if (_proxy.g_name_owner != null)
                    return;
                const [key, _] = Array.from(
                    this._items.entries())
                    .find(value => value[1] === _proxy) || [];
                if (!key)
                    return;
                this._items.delete(key);
                this._dbus.emit_signal(
                    'StatusNotifierItemUnregistered',
                    new GLib.Variant('(s)', [key]));
                this.emit('changed');
            });
        this._dbus.emit_signal(
            'StatusNotifierItemRegistered',
            new GLib.Variant('(s)', [busName + objectPath]));

        this.emit('changed');
    }

    _on_item_signal(
        proxy: TStatusNotifierItemProxy,
        senderName: string,
        signalName: string,
        parameters: GLib.Variant<any>) {
        if (signalName === 'NewTitle'){
            this._refresh_property(proxy, 'Title');
            this.emit('changed');
        }
        if (signalName === 'NewIcon'){
            this._refresh_property(proxy, 'IconName');
            this._refresh_property(proxy, 'IconPixmap');
            this._refresh_property(proxy, 'AttentionIconName');
            this._refresh_property(
                proxy, 'AttentionIconPixmap');
            this.emit('changed');
        }
        if (signalName === 'NewToolTip'){
            this._refresh_property(proxy, 'ToolTip');
            this.emit('changed');
        }
        if (signalName === 'NewStatus') {
            this._refresh_property(proxy, 'Status');
            this.emit('changed');
        }
    }


    _refresh_property(proxy: TStatusNotifierItemProxy, property: string) {
        if (!proxy[property])
            return;
        const [prop_value] = (proxy.g_connection.call_sync(
            proxy.g_name,
            proxy.g_object_path,
            'org.freedesktop.DBus.Properties',
            'Get',
            GLib.Variant.new('(ss)',
                [proxy.g_interface_name,
                    property]),
            GLib.VariantType.new('(v)'),
            Gio.DBusCallFlags.NONE, -1,
            null) as GLib.Variant<'(v)'>)
            .deep_unpack();
        this._update_property(proxy, property, prop_value);
    }


    _refresh_all_properties(proxy: TStatusNotifierItemProxy) {
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
        value: GLib.Variant<any>) {
        proxy.set_cached_property(property_name, value);
        if (property_name === 'Menu' && proxy.Menu !== value.unpack()) {
            //new menu path, construct new proxy
            proxy.DbusMenusClient = this._createMenu(proxy);
        }
    }

    _createMenu(item: TStatusNotifierItemProxy) {
        const menu = new Dbusmenu.Client(
            { dbus_name: item.g_name_owner, dbus_object: item.Menu });
        menu.connect('layout-updated', (
            client: Dbusmenu.Client) => {
            const menu_items = this._createRootMenu(menu, client.get_root());
            item.AgsMenu.children = menu_items;
            item.AgsMenu.show_all();
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

    get_pixbuf(pixMapArray: [number, number, Uint8Array][], iconSize: number) {
        const pixMap =
            pixMapArray.sort((a, b) => a[0] - b[0])
                .find(elem => elem[0] >= iconSize) || pixMapArray.pop();
        if (!pixMap)
            return;
        const array :Uint8Array = Uint8Array.from(pixMap[2]);
        for (let i = 0; i < 4 * pixMap[0] * pixMap[1]; i += 4) {
            const alpha = array[i];
            array[i] = array[i + 1];
            array[i + 1] = array[i + 2];
            array[i + 2] = array[i + 3];
            array[i + 3] = alpha;
        }
        const pixbuf = GdkPixbuf.Pixbuf.new_from_bytes(
            array,
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

    get_icon(item: TStatusNotifierItemProxy) {
        const icon = new AgsIcon({});
        const iconSize = icon.get_style_context()
            .get_property('font-size', Gtk.StateFlags.NORMAL) as number;
        if (item.Status === 'NeedsAttention') {
            if (item.AttentionIconName) {
                icon.icon = item.AttentionIconName;
            } else {
                icon.set_from_pixbuf(
                    this.get_pixbuf(item.AttentionIconPixmap, iconSize));
            }
        }
        else {
            if (item.IconName) {
                icon.icon = item.IconName;
            } else {
                icon.set_from_pixbuf(
                    this.get_pixbuf(item.IconPixmap, iconSize));
            }
        }
        return icon;
    }

    get_tooltip_markup(item: TStatusNotifierItemProxy) {
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

    static get_icon(item: TStatusNotifierItemProxy) {
        return SystemTray.instance.get_icon(item);
    }

    static get_tooltip_markup(item: TStatusNotifierItemProxy) {
        return SystemTray.instance.get_tooltip_markup(item);
    }
}
