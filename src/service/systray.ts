import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import Dbusmenu from 'gi://Dbusmenu';
import Service from './service.js';
import {
    StatusNotifierItemProxy,
} from '../dbus/types.js';
import { Label, MenuItem } from '../widget.js';
import { AgsMenu, AgsMenuItem } from '../widgets/menu.js';
import Gtk from 'gi://Gtk?version=3.0';
import { loadInterfaceXML } from '../utils.js';

const StatusNotifierWatcherIFace =
    loadInterfaceXML('org.kde.StatusNotifierWatcher');
const StatusNotifierItemIFace = loadInterfaceXML('org.kde.StatusNotifierItem');
const StatusNotifierItemProxy = Gio.DBusProxy
    .makeProxyWrapper(StatusNotifierItemIFace) as StatusNotifierItemProxy;

class TrayIcon extends Service {
    static {
        Service.register(this, {
            'removed': ['string'],
        });
    }

    busName: string;
    objectPath: string;
    _itemProxy: StatusNotifierItemProxy;
    _dbusMenusClient?: Dbusmenu.Client;

    category?: string;
    id?: string;
    title?: string;
    status?: string;
    windowId?: number;
    itemIsMenu?: boolean;
    menu?: AgsMenu;
    icon?: string | GdkPixbuf.Pixbuf;
    tooltipMarkup?: string;

    constructor(busName: string, objectPath: string) {
        super();

        this.busName = busName;
        this.objectPath = objectPath;

        this.icon = 'image-missing';
        this.tooltipMarkup = '';

        this._itemProxy = new StatusNotifierItemProxy(
            Gio.DBus.session,
            busName,
            objectPath,
            this._item_proxy_acquired.bind(this),
            null,
            Gio.DBusProxyFlags.NONE);
    }

    _item_proxy_acquired(proxy: StatusNotifierItemProxy, error: any) {
        if (error !== null)
            return;
        const busName = proxy.g_name_owner;
        const objectPath = proxy.g_object_path;
        if (proxy.Menu)
            this._dbusMenusClient = this._createMenu(proxy);
        proxy.connect('g-signal', () => {
            this._refresh_all_properties(proxy);
            this._updateState();
        });
        proxy.connect('notify::g-name-owner',
            () => {
                if (!this._itemProxy.g_name_owner)
                    this.emit('removed', this.busName);
            });
        proxy.connect('g-properties-changed', () => this._updateState());


        this._updateState();

        this.emit('changed');
    }

    _refresh_property(proxy: StatusNotifierItemProxy, property: string) {
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


    _refresh_all_properties(proxy: StatusNotifierItemProxy) {
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
        proxy: StatusNotifierItemProxy,
        property_name: string,
        value: GLib.Variant<any>) {
        proxy.set_cached_property(property_name, value);
        if (property_name === 'Menu' && proxy.Menu !== value.unpack()) {
            //new menu path, construct new proxy
            this._dbusMenusClient = this._createMenu(proxy);
        }
    }

    _updateState() {
        this.category = this._itemProxy.Category;
        this.id = this._itemProxy.Id;
        this.title = this._itemProxy.Title;
        this.status = this._itemProxy.Status;
        this.windowId = this._itemProxy.WindowId;
        this.itemIsMenu = this._itemProxy.ItemIsMenu;
        this.updateTooltipMarkup();
        this.updateIcon();
        this.emit('changed');
    }

    _createMenu(item: StatusNotifierItemProxy) {
        const menu = new Dbusmenu.Client(
            { dbus_name: item.g_name_owner, dbus_object: item.Menu });
        menu.connect('layout-updated', (
            client: Dbusmenu.Client) => {
            const menu_items = this._createRootMenu(menu, client.get_root());
            if (!this.menu)
                this.menu = new AgsMenu({ children: [] });
            this.menu.children = menu_items;
            this.menu.show_all();
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

    get_pixbuf(pixMapArray: [number, number, Uint8Array][]) {
        if (!pixMapArray)
            return;
        const pixMap =
            pixMapArray.sort((a, b) => a[0] - b[0]).pop();
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
        return pixbuf;
    }

    updateIcon() {
        if (this.status === 'NeedsAttention'){
            if (this._itemProxy.AttentionIconName) {
                this.icon = this._itemProxy.AttentionIconName;
            } else {
                this.icon =
                    this.get_pixbuf(this._itemProxy.AttentionIconPixmap);
            }
        }
        else {
            if (this._itemProxy.IconName)
                this.icon = this._itemProxy.IconName;
            else
                this.icon = this.get_pixbuf(this._itemProxy.IconPixmap);
        }
    }

    updateTooltipMarkup() {
        if (!this._itemProxy.ToolTip) {
            this.tooltipMarkup = '';
            return;
        }
        let tooltip_markup = this._itemProxy.ToolTip[2];
        if (this._itemProxy.ToolTip[3] !== '')
            tooltip_markup += '\n' + this._itemProxy.ToolTip[3];
        this.tooltipMarkup = tooltip_markup;
    }

    activate(event: any){
        if (!event)
            event = Gtk.get_current_event();
        this._itemProxy.ActivateAsync(
            event.get_root_coords()[1], event.get_root_coords()[2]);
    }

    openMenu(event: any){
        if (!event)
            event = Gtk.get_current_event();
        if (this.menu) {
            this.menu.popup_at_pointer(event);
        }
        else {
            this._itemProxy.ContextMenuAsync(
                event.get_root_coords()[1], event.get_root_coords()[2]);
        }
    }
}

class SystemTrayService extends Service {
    static {
        Service.register(this, {
            'added': ['string'],
            'removed': ['string'],
        });
    }

    _dbus!: Gio.DBusExportedObject;
    _items: Map<string, TrayIcon>;

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
    }

    _register() {
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

        const trayIcon = new TrayIcon(busName, objectPath);
        this._items.set(busName, trayIcon);

        this._dbus.emit_signal(
            'StatusNotifierItemRegistered',
            new GLib.Variant('(s)', [busName + objectPath]));
        this.emit('added', trayIcon.busName);
        this.emit('changed');

        trayIcon.connect('removed', () => {
            const key = trayIcon.busName;
            this._items.delete(key);
            this.emit('removed', trayIcon.busName);
            this.emit('changed');
            this._dbus.emit_signal(
                'StatusNotifierItemUnregistered',
                new GLib.Variant('(s)', [key]));
        });
    }

    getTrayIcon(name: string) {
        return this._items.get(name);
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

    static getTrayIcon(name: string) {
        return SystemTray._instance.getTrayIcon(name);
    }
}
