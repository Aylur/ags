import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';
import GLib from 'gi://GLib';
import Service from '../service.js';
import App from '../app.js';
import {
    CACHE_DIR, ensureDirectory,
    loadInterfaceXML, readFileAsync,
    timeout, writeFile,
} from '../utils.js';

const NOTIFICATIONS_CACHE_PATH = `${CACHE_DIR}/notifications`;
const CACHE_FILE = NOTIFICATIONS_CACHE_PATH + '/notifications.json';
const NotificationIFace = loadInterfaceXML('org.freedesktop.Notifications');

interface Action {
    id: string
    label: string
}

interface Hints {
    'image-data'?: GLib.Variant
    'desktop-entry'?: GLib.Variant
    'urgency'?: GLib.Variant
    [hint: string]: GLib.Variant | undefined
}

interface NotifcationJson {
    id: number
    appName: string
    appEntry: string | null
    appIcon: string
    summary: string
    body: string
    actions: Action[]
    urgency: string
    time: number
    image: string | null
}

const _URGENCY = (urgency?: number) => {
    switch (urgency) {
        case 0: return 'low';
        case 2: return 'critical';
        default: return 'normal';
    }
};

class Notification extends Service {
    static {
        Service.register(this, {
            'dismissed': [],
            'closed': [],
            'invoked': ['string'],
        }, {
            'id': ['int'],
            'app-name': ['string'],
            'app-entry': ['string'],
            'app-icon': ['string'],
            'summary': ['string'],
            'body': ['string'],
            'actions': ['jsobject'],
            'urgency': ['string'],
            'time': ['int'],
            'image': ['string'],
            'popup': ['boolean'],
            'hints': ['jsobject'],
        });
    }

    _id: number;
    _appName: string;
    _appEntry: string | null;
    _appIcon: string;
    _summary: string;
    _body: string;
    _actions: Action[] = [];
    _urgency: string;
    _time: number;
    _image: string | null;
    _popup: boolean;
    _hints: Hints = {};

    get id() { return this._id; }
    get app_name() { return this._appName; }
    get app_entry() { return this._appEntry; }
    get app_icon() { return this._appIcon; }
    get summary() { return this._summary; }
    get body() { return this._body; }
    get actions() { return this._actions; }
    get urgency() { return this._urgency; }
    get time() { return this._time; }
    get image() { return this._image; }
    get popup() { return this._popup; }

    constructor(
        appName: string,
        id: number,
        appIcon: string,
        summary: string,
        body: string,
        acts: string[],
        hints: Hints,
        popup: boolean,
    ) {
        super();

        for (let i = 0; i < acts.length; i += 2) {
            acts[i + 1] !== '' && this._actions.push({
                label: acts[i + 1],
                id: acts[i],
            });
        }

        this._urgency = _URGENCY(hints['urgency']?.unpack<number>());
        this._id = id;
        this._appName = appName;
        this._appEntry = hints['desktop-entry']?.unpack<string>() || null;
        this._appIcon = appIcon;
        this._summary = summary;
        this._body = body;
        this._time = GLib.DateTime.new_now_local().to_unix();
        this._image = this._appIconIsFile() ? appIcon : this._parseImageData(hints['image-data']);
        this._popup = popup;
        this._hints = hints;
    }

    dismiss() {
        this._popup = false;
        this.changed('popup');
        this.emit('dismissed');
    }

    close() {
        this.emit('closed');
    }

    invoke(id: string) {
        this.emit('invoked', id);
        this.close();
    }

    toJson(cacheActions = App.config.cacheNotificationActions) {
        return {
            id: this._id,
            appName: this._appName,
            appEntry: this._appEntry,
            appIcon: this._appIcon,
            summary: this._summary,
            body: this._body,
            actions: cacheActions ? this._actions : [],
            urgency: this._urgency,
            time: this._time,
            image: this._image,
        };
    }

    static fromJson(json: NotifcationJson) {
        const { id, appName, appEntry, appIcon, summary,
            body, actions, urgency, time, image } = json;

        const n = new Notification(appName, id, appIcon, summary, body, [], {}, false);
        n._actions = actions;
        n._appEntry = appEntry;
        n._urgency = urgency;
        n._time = time;
        n._image = image;
        return n;
    }

    private _appIconIsFile() {
        return GLib.file_test(this._appIcon, GLib.FileTest.EXISTS) ||
            GLib.file_test(this._appIcon.replace(/^(file\:\/\/)/, ''), GLib.FileTest.EXISTS);
    }

    private _parseImageData(imageData?: InstanceType<typeof GLib.Variant>) {
        if (!imageData)
            return null;

        ensureDirectory(NOTIFICATIONS_CACHE_PATH);
        const fileName = NOTIFICATIONS_CACHE_PATH + `/${this._id}`;
        const [w, h, rs, alpha, bps, _, data] = imageData // iiibiiay
            .recursiveUnpack<[number, number, number, boolean, number, number, GLib.Bytes]>();

        const pixbuf = GdkPixbuf.Pixbuf.new_from_bytes(
            data, GdkPixbuf.Colorspace.RGB, alpha, bps, w, h, rs);

        const outputStream = Gio.File.new_for_path(fileName)
            .replace(null, false, Gio.FileCreateFlags.NONE, null);

        pixbuf.save_to_streamv(outputStream, 'png', null, null, null);
        outputStream.close(null);

        return fileName;
    }
}

class Notifications extends Service {
    static {
        Service.register(this, {
            'dismissed': ['int'],
            'notified': ['int'],
            'closed': ['int'],
        }, {
            'notifications': ['jsobject'],
            'popups': ['jsobject'],
            'dnd': ['boolean'],
        });
    }

    private _dbus!: Gio.DBusExportedObject;
    private _notifications: Map<number, Notification>;
    private _dnd = false;
    private _idCount = 0;

    constructor() {
        super();

        this._notifications = new Map();
        this._readFromFile();
        this._register();
    }

    get dnd() { return this._dnd; }
    set dnd(value: boolean) {
        this._dnd = value;
        this.changed('dnd');
    }

    get notifications() {
        return Array.from(this._notifications.values());
    }

    get popups() {
        const list = [];
        for (const [, notification] of this._notifications) {
            if (notification.popup)
                list.push(notification);
        }
        return list;
    }

    getPopup(id: number) {
        const n = this._notifications.get(id);
        return n?.popup ? n : null;
    }

    getNotification(id: number) {
        return this._notifications.get(id);
    }

    Notify(
        appName: string,
        replacesId: number,
        appIcon: string,
        summary: string,
        body: string,
        acts: string[],
        hints: Hints,
    ) {
        const id = replacesId || this._idCount++;
        const n = new Notification(appName, id, appIcon, summary, body, acts, hints, !this.dnd);
        timeout(App.config.notificationPopupTimeout, () => this.DismissNotification(id));
        this._addNotification(n);
        !this._dnd && this.notify('popups');
        this.notify('notifications');
        this.emit('notified', id);
        this.emit('changed');
        this._cache();
        return id;
    }

    Clear() { this.clear(); }

    DismissNotification(id: number) {
        this._notifications.get(id)?.dismiss();
    }

    CloseNotification(id: number) {
        this._notifications.get(id)?.close();
    }

    InvokeAction(id: number, actionId: string) {
        this._notifications.get(id)?.invoke(actionId);
    }

    GetCapabilities() {
        return ['actions', 'body', 'icon-static', 'persistence'];
    }

    GetServerInformation() {
        return new GLib.Variant('(ssss)', [pkg.name, 'Aylur', pkg.version, '1.2']);
    }

    clear() {
        for (const [id] of this._notifications)
            this.CloseNotification(id);
    }

    private _addNotification(n: Notification) {
        n.connect('dismissed', this._onDismissed.bind(this));
        n.connect('closed', this._onClosed.bind(this));
        n.connect('invoked', this._onInvoked.bind(this));
        this._notifications.set(n.id, n);
    }

    private _onDismissed(n: Notification) {
        this.emit('dismissed', n.id);
        this.changed('popups');
    }

    private _onClosed(n: Notification) {
        this._dbus.emit_signal('NotificationClosed',
            new GLib.Variant('(uu)', [n.id, 3]));

        this._notifications.delete(n.id);
        this.notify('notifications');
        this.notify('popups');
        this.emit('closed', n.id);
        this.emit('changed');
        this._cache();
    }

    private _onInvoked(n: Notification, id: string) {
        this._dbus.emit_signal('ActionInvoked',
            new GLib.Variant('(us)', [n.id, id]));
    }

    private _register() {
        Gio.bus_own_name(
            Gio.BusType.SESSION,
            'org.freedesktop.Notifications',
            Gio.BusNameOwnerFlags.NONE,
            (connection: Gio.DBusConnection) => {
                this._dbus = Gio.DBusExportedObject
                    .wrapJSObject(NotificationIFace as string, this);

                this._dbus.export(connection, '/org/freedesktop/Notifications');
            },
            null,
            () => {
                print('Another notification daemon is already running, ' +
                    'make sure you stop Dunst ' +
                    'or any other daemon you have running');
            },
        );
    }

    private async _readFromFile() {
        try {
            const file = await readFileAsync(CACHE_FILE);
            const notifications = JSON.parse(file)
                .map((n: NotifcationJson) => Notification.fromJson(n));

            for (const n of notifications) {
                this._addNotification(n);
                if (n.id > this._idCount)
                    this._idCount = n.id + 1;
            }

            this.changed('notifications');
        } catch (_) {
            // most likely there is no cache yet
        }
    }

    private _cache() {
        ensureDirectory(NOTIFICATIONS_CACHE_PATH);
        const arr = Array.from(this._notifications.values()).map(n => n.toJson());
        writeFile(JSON.stringify(arr, null, 2), CACHE_FILE).catch(err => console.error(err));
    }
}


export default new Notifications();
