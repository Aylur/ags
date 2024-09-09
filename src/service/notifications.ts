import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';
import GLib from 'gi://GLib';
import Service from '../service.js';
import {
    CACHE_DIR, ensureDirectory,
    loadInterfaceXML, readFileAsync,
    timeout, writeFile,
} from '../utils.js';
import { daemon } from '../utils/notify.js';

const NOTIFICATIONS_CACHE_PATH = `${CACHE_DIR}/notifications`;
const CACHE_FILE = NOTIFICATIONS_CACHE_PATH + '/notifications.json';
const NotificationIFace = loadInterfaceXML('org.freedesktop.Notifications');

export interface Action {
    id: string
    label: string
}

export interface Hints {
    'action-icons'?: GLib.Variant // boolean
    'category'?: GLib.Variant // string
    'desktop-entry'?: GLib.Variant // string
    'image-data'?: GLib.Variant // iiibiiay
    'image-path'?: GLib.Variant // string
    'resident'?: GLib.Variant // boolean
    'sound-file'?: GLib.Variant // string
    'sound-name'?: GLib.Variant // string
    'suppress-sound'?: GLib.Variant // boolean
    'transient'?: GLib.Variant // boolean
    'urgency'?: GLib.Variant // 0 | 1 | 2
    'x'?: GLib.Variant // number
    'y'?: GLib.Variant // number
    [hint: string]: GLib.Variant | undefined
}

interface NotifcationJson {
    id: number
    appName: string
    appIcon: string
    summary: string
    body: string
    actions: Action[]
    urgency: Urgency
    time: number
    image?: string;
    appEntry?: string;
    actionIcons?: boolean;
    category?: string;
    resident?: boolean;
    soundFile?: string;
    soundName?: string;
    suppressSound?: boolean;
    transient?: boolean;
    x?: number;
    y?: number;
}

export type Urgency = 'low' | 'critical' | 'normal'

const _URGENCY = (urgency?: number): Urgency => {
    switch (urgency) {
        case 0: return 'low';
        case 2: return 'critical';
        default: return 'normal';
    }
};

export class Notification extends Service {
    static {
        Service.register(this, {
            'dismissed': [],
            'closed': [],
            'invoked': ['string'],
        }, {
            'action-icons': ['boolean'],
            'actions': ['jsobject'],
            'app-entry': ['string'],
            'app-icon': ['string'],
            'app-name': ['string'],
            'body': ['string'],
            'category': ['string'],
            'id': ['int'],
            'image': ['string'],
            'popup': ['boolean'],
            'resident': ['boolean'],
            'sound-file': ['string'],
            'sound-name': ['string'],
            'summary': ['string'],
            'suppress-sound': ['boolean'],
            'time': ['int'],
            'timeout': ['int', 'rw'],
            'transient': ['boolean'],
            'urgency': ['string'],
            'x': ['int'],
            'y': ['int'],
            'hints': ['jsobject'],
        });
    }

    private _actionIcons?: boolean;
    private _actions: Action[] = [];
    private _appEntry?: string;
    private _appIcon: string;
    private _appName: string;
    private _body: string;
    private _category?: string;
    private _id: number;
    private _image?: string;
    private _popup: boolean;
    private _resident?: boolean;
    private _soundFile?: string;
    private _soundName?: string;
    private _summary: string;
    private _suppressSound?: boolean;
    private _time: number;
    private _timeout!: number;
    private _transient?: boolean;
    private _urgency: Urgency;
    private _x?: number;
    private _y?: number;
    private _hints: Hints = {};

    get action_icons() { return this._actionIcons; }
    get actions() { return this._actions; }
    get app_entry() { return this._appEntry; }
    get app_icon() { return this._appIcon; }
    get app_name() { return this._appName; }
    get body() { return this._body; }
    get category() { return this._category; }
    get id() { return this._id; }
    get image() { return this._image; }
    get popup() { return this._popup; }
    get resident() { return this._resident; }
    get sound_file() { return this._soundFile; }
    get sound_name() { return this._soundName; }
    get summary() { return this._summary; }
    get suppress_sound() { return this._suppressSound; }
    get time() { return this._time; }
    get timeout() { return this._timeout; }
    get transient() { return this._transient; }
    get urgency() { return this._urgency; }
    get x() { return this._x; }
    get y() { return this._y; }
    get hints() { return this._hints; }

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

        this._id = id;
        this._appName = appName;
        this._appIcon = appIcon;
        this._summary = summary;
        this._body = body;
        this._time = GLib.DateTime.new_now_local().to_unix();
        this._image = this._appIconImage() ||
            this._parseImageData(hints['image-data']) ||
            hints['image-path']?.unpack();

        this._popup = popup;
        this._urgency = _URGENCY(hints['urgency']?.unpack());

        this._appEntry = hints['desktop-entry']?.unpack();
        this._actionIcons = hints['action-icons']?.unpack();
        this._category = hints['category']?.unpack();
        this._resident = hints['resident']?.unpack();
        this._soundFile = hints['sound-file']?.unpack();
        this._soundName = hints['sound-name']?.unpack();
        this._suppressSound = hints['suppress-sound']?.unpack();
        this._transient = hints['transient']?.unpack();
        this._x = hints['x']?.unpack();
        this._y = hints['y']?.unpack();
        this._hints = hints;
    }

    readonly dismiss = () => {
        this._popup = false;
        this.changed('popup');
        this.emit('dismissed');
    };

    readonly close = () => {
        this.emit('closed');
    };

    readonly invoke = (id: string) => {
        this.emit('invoked', id);
        if (!this.resident)
            this.close();
    };

    toJson(cacheActions = notifications.cacheActions): NotifcationJson {
        return {
            actionIcons: this._actionIcons,
            actions: cacheActions ? this._actions : [],
            appEntry: this._appEntry,
            appIcon: this._appIcon,
            appName: this._appName,
            body: this._body,
            category: this._category,
            id: this._id,
            image: this._image,
            resident: this._resident,
            soundFile: this._soundFile,
            soundName: this._soundName,
            summary: this._summary,
            suppressSound: this._suppressSound,
            time: this._time,
            transient: this._transient,
            urgency: this._urgency,
            x: this._x,
            y: this._y,
        };
    }

    static fromJson(json: NotifcationJson) {
        const { id, appName, appIcon, summary, body, ...j } = json;

        const n = new Notification(appName, id, appIcon, summary, body, [], {}, false);
        for (const key of Object.keys(j))
            // @ts-expect-error too lazy to type
            n[`_${key}`] = j[key];

        return n;
    }

    private _appIconImage() {
        if (GLib.file_test(this._appIcon, GLib.FileTest.EXISTS) ||
            GLib.file_test(this._appIcon.replace(/^(file\:\/\/)/, ''), GLib.FileTest.EXISTS))
            return this._appIcon;
    }

    private _parseImageData(imageData?: InstanceType<typeof GLib.Variant>) {
        if (!imageData)
            return null;

        ensureDirectory(NOTIFICATIONS_CACHE_PATH);
        const fileName = NOTIFICATIONS_CACHE_PATH + `/${this._id}`;
        const [w, h, rs, alpha, bps, _, data] = imageData // iiibiiay
            .recursiveUnpack<[number, number, number, boolean, number, number, GLib.Bytes]>();

        if (bps !== 8) {
            console.warn(`Notification image error from ${this.app_name}: ` +
                'Currently only RGB images with 8 bits per sample are supported.');
            return null;
        }

        const pixbuf = GdkPixbuf.Pixbuf.new_from_bytes(
            data, GdkPixbuf.Colorspace.RGB, alpha, bps, w, h, rs);

        if (!pixbuf)
            return null;

        const outputStream = Gio.File.new_for_path(fileName)
            .replace(null, false, Gio.FileCreateFlags.NONE, null);

        pixbuf.save_to_streamv(outputStream, 'png', null, null, null);
        outputStream.close(null);

        return fileName;
    }
}

export class Notifications extends Service {
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

    public popupTimeout = 3000;
    public forceTimeout = false;
    public cacheActions = false;
    public clearDelay = 100;

    private _dbus!: Gio.DBusExportedObject;
    private _notifications: Map<number, Notification>;
    private _dnd = false;
    private _idCount = 1;

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

    readonly getPopup = (id: number) => {
        const n = this._notifications.get(id);
        return n?.popup ? n : null;
    };

    readonly getNotification = (id: number) => {
        return this._notifications.get(id);
    };

    Notify(
        appName: string,
        replacesId: number,
        appIcon: string,
        summary: string,
        body: string,
        acts: string[],
        hints: Hints,
        expiration: number,
    ) {
        const id = this._notifications.has(replacesId) ? replacesId : this._idCount++;
        const n = new Notification(appName, id, appIcon, summary, body, acts, hints, !this.dnd);

        if (this.forceTimeout || expiration === -1) {
            n.updateProperty('timeout', this.popupTimeout);
            timeout(this.popupTimeout, () => this.DismissNotification(id));
        } else {
            n.updateProperty('timeout', expiration);
            if (expiration > 0)
                timeout(expiration, () => this.DismissNotification(id));
        }

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
        return [
            'action-icons',
            'actions',
            'body',
            'body-hyperlinks',
            'body-markup',
            'icon-static',
            'persistence',
            'sound',
        ];
    }

    GetServerInformation() {
        return new GLib.Variant('(ssss)', [pkg.name, 'Aylur', pkg.version, '1.2']);
    }

    readonly clear = async () => {
        const close = (n: Notification, delay: number) => new Promise(resolve => {
            this._notifications.has(n.id)
                ? timeout(delay, () => resolve(n.close()))
                : resolve(null);
        });
        return Promise.all(this.notifications.map((n, i) => close(n, this.clearDelay * i)));
    };

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
            () => {
                daemon.running = true;
            },
            () => {
                const [name] = Gio.DBus.session.call_sync(
                    'org.freedesktop.Notifications',
                    '/org/freedesktop/Notifications',
                    'org.freedesktop.Notifications',
                    'GetServerInformation',
                    null,
                    null,
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null).deepUnpack() as string[];

                console.warn(`Another notification daemon is already running: ${name}`);
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

export const notifications = new Notifications;
export default notifications;
