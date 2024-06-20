import Gdk from 'gi://Gdk?version=3.0';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from '../service.js';

Gio._promisify(Gio.DataInputStream.prototype, 'read_upto_async');

const HIS = GLib.getenv('HYPRLAND_INSTANCE_SIGNATURE');
const XDG_RUNTIME_DIR = GLib.getenv('XDG_RUNTIME_DIR') || '/';

export class ActiveClient extends Service {
    static {
        Service.register(this, {}, {
            'address': ['string'],
            'title': ['string'],
            'class': ['string'],
        });
    }

    private _address = '';
    private _title = '';
    private _class = '';

    get address() { return this._address; }
    get title() { return this._title; }
    get class() { return this._class; }
}

export class ActiveID extends Service {
    static {
        Service.register(this, {}, {
            'id': ['int'],
            'name': ['string'],
        });
    }

    private _id = 1;
    private _name = '';

    get id() { return this._id; }
    get name() { return this._name; }

    update(id: number, name: string) {
        super.updateProperty('id', id);
        super.updateProperty('name', name);
    }
}

export class Actives extends Service {
    static {
        Service.register(this, {}, {
            'client': ['jsobject'],
            'monitor': ['jsobject'],
            'workspace': ['jsobject'],
        });
    }

    private _client = new ActiveClient;
    private _monitor = new ActiveID;
    private _workspace = new ActiveID;

    constructor() {
        super();

        (['client', 'workspace', 'monitor'] as const).forEach(obj => {
            this[`_${obj}`].connect('changed', () => {
                this.notify(obj);
                this.emit('changed');
            });
        });
    }

    get client() { return this._client; }
    get monitor() { return this._monitor; }
    get workspace() { return this._workspace; }
}

export class Hyprland extends Service {
    static {
        Service.register(this, {
            'event': ['string', 'string'],
            'urgent-window': ['string'],
            'submap': ['string'],
            'keyboard-layout': ['string', 'string'],
            'monitor-added': ['string'],
            'monitor-removed': ['string'],
            'workspace-added': ['string'],
            'workspace-removed': ['string'],
            'client-added': ['string'],
            'client-removed': ['string'],
            'fullscreen': ['boolean'],
        }, {
            'active': ['jsobject'],
            'monitors': ['jsobject'],
            'workspaces': ['jsobject'],
            'clients': ['jsobject'],
        });
    }

    private _active: Actives = new Actives();
    private _monitors: Map<number, Monitor> = new Map();
    private _workspaces: Map<number, Workspace> = new Map();
    private _clients: Map<string, Client> = new Map();
    private _decoder = new TextDecoder();
    private _encoder = new TextEncoder();

    get active() { return this._active; }
    get monitors() { return Array.from(this._monitors.values()); }
    get workspaces() { return Array.from(this._workspaces.values()); }
    get clients() { return Array.from(this._clients.values()); }

    readonly getMonitor = (id: number) => this._monitors.get(id);
    readonly getWorkspace = (id: number) => this._workspaces.get(id);
    readonly getClient = (address: string) => this._clients.get(address);

    readonly getGdkMonitor = (id: number) => {
        const monitor = this._monitors.get(id);
        if (!monitor)
            return null;

        return Gdk.Display.get_default()?.get_monitor_at_point(monitor.x, monitor.y) || null;
    };

    constructor() {
        if (!HIS)
            console.error('Hyprland is not running');

        super();

        // init monitor
        for (const m of JSON.parse(this.message('j/monitors')) as Monitor[]) {
            this._monitors.set(m.id, m);
            if (m.focused) {
                this._active.monitor.update(m.id, m.name);
                this._active.workspace.update(m.activeWorkspace.id, m.activeWorkspace.name);
            }
        }

        // init workspaces
        for (const ws of JSON.parse(this.message('j/workspaces')) as Workspace[])
            this._workspaces.set(ws.id, ws);

        // init clients
        for (const c of JSON.parse(this.message('j/clients')) as Client[])
            this._clients.set(c.address, c);

        this._watchSocket(new Gio.DataInputStream({
            close_base_stream: true,
            base_stream: this._connection('socket2')
                .get_input_stream(),
        }));

        this._active.connect('changed', () => this.changed('active'));
    }

    private _connection(socket: 'socket' | 'socket2') {
        const sock = (pre: string) => `${pre}/hypr/${HIS}/.${socket}.sock`;

        const path = GLib.file_test(sock(XDG_RUNTIME_DIR), GLib.FileTest.EXISTS)
            ? sock(XDG_RUNTIME_DIR)
            : sock('/tmp');

        return new Gio.SocketClient()
            .connect(new Gio.UnixSocketAddress({ path }), null);
    }

    private _watchSocket(stream: Gio.DataInputStream) {
        stream.read_line_async(0, null, (stream, result) => {
            if (!stream)
                return console.error('Error reading Hyprland socket');

            const [line] = stream.read_line_finish(result);
            this._onEvent(this._decoder.decode(line));
            this._watchSocket(stream);
        });
    }

    // FIXME: deprecated
    readonly sendMessage = (cmd: string) => {
        console.warn('hyprland.sendMessage is DEPRECATED, '
            + ' use hyprland.message or hyprland.messageAsync');
        return this.messageAsync(cmd);
    };

    private _socketStream(cmd: string) {
        const connection = this._connection('socket');

        connection
            .get_output_stream()
            .write(this._encoder.encode(cmd), null);

        const stream = new Gio.DataInputStream({
            close_base_stream: true,
            base_stream: connection.get_input_stream(),
        });

        return [connection, stream] as const;
    }

    readonly message = (cmd: string) => {
        const [connection, stream] = this._socketStream(cmd);
        try {
            const [response] = stream.read_upto('\x04', -1, null);
            return response || '';
        } catch (error) {
            logError(error);
        } finally {
            connection.close(null);
        }
        return '';
    };

    readonly messageAsync = async (cmd: string) => {
        const [connection, stream] = this._socketStream(cmd);
        try {
            const result = await stream.read_upto_async('\x04', -1, 0, null);
            const [response] = result as unknown as [string, number];
            return response;
        } catch (error) {
            logError(error);
        } finally {
            connection.close(null);
        }
        return '';
    };

    private async _syncMonitors(notify = true) {
        try {
            const msg = await this.messageAsync('j/monitors');
            this._monitors.clear();
            for (const m of JSON.parse(msg) as Array<Monitor>) {
                this._monitors.set(m.id, m);
                if (m.focused) {
                    this._active.monitor.update(m.id, m.name);
                    this._active.workspace.update(m.activeWorkspace.id, m.activeWorkspace.name);
                    this._active.monitor.emit('changed');
                    this._active.workspace.emit('changed');
                }
            }
            if (notify)
                this.notify('monitors');
        } catch (error) {
            logError(error);
        }
    }

    private async _syncWorkspaces(notify = true) {
        try {
            const msg = await this.messageAsync('j/workspaces');
            this._workspaces.clear();
            for (const ws of JSON.parse(msg) as Array<Workspace>)
                this._workspaces.set(ws.id, ws);

            if (notify)
                this.notify('workspaces');
        } catch (error) {
            logError(error);
        }
    }

    private async _syncClients(notify = true) {
        try {
            const msg = await this.messageAsync('j/clients');
            this._clients.clear();
            for (const c of JSON.parse(msg) as Array<Client>)
                this._clients.set(c.address, c);

            if (notify)
                this.notify('clients');
        } catch (error) {
            logError(error);
        }
    }

    private async _onEvent(event: string) {
        if (!event)
            return;

        const [e, params] = event.split('>>');
        const argv = params.split(',');

        try {
            switch (e) {
                case 'workspace':
                case 'focusedmon':
                    await this._syncMonitors();
                    break;

                case 'monitorremoved':
                    await this._syncMonitors();
                    this.emit('monitor-removed', argv[0]);
                    break;

                case 'monitoradded':
                    await this._syncMonitors();
                    this.emit('monitor-added', argv[0]);
                    break;

                case 'createworkspace':
                    await this._syncWorkspaces();
                    this.emit('workspace-added', argv[0]);
                    break;

                case 'destroyworkspace':
                    await this._syncWorkspaces();
                    this.emit('workspace-removed', argv[0]);
                    break;

                case 'openwindow':
                    await this._syncClients(false);
                    await this._syncWorkspaces(false);
                    ['clients', 'workspaces'].forEach(e => this.notify(e));
                    this.emit('client-added', '0x' + argv[0]);
                    break;

                case 'movewindow':
                case 'windowtitle':
                    await this._syncClients(false);
                    await this._syncWorkspaces(false);
                    ['clients', 'workspaces'].forEach(e => this.notify(e));
                    break;

                case 'moveworkspace':
                    await this._syncClients(false);
                    await this._syncWorkspaces(false);
                    await this._syncMonitors(false);
                    ['clients', 'workspaces', 'monitors'].forEach(e => this.notify(e));
                    break;

                case 'fullscreen':
                    await this._syncClients(false);
                    await this._syncWorkspaces(false);
                    ['clients', 'workspaces'].forEach(e => this.notify(e));
                    this.emit('fullscreen', argv[0] === '1');
                    break;

                case 'activewindow':
                    this._active.client.updateProperty('class', argv[0]);
                    this._active.client.updateProperty('title', argv.slice(1).join(','));
                    this._active.client.emit('changed');
                    break;

                case 'activewindowv2':
                    this._active.client.updateProperty('address', '0x' + argv[0]);
                    this._active.client.emit('changed');
                    break;

                case 'closewindow':
                    await this._syncWorkspaces(false);
                    await this._syncClients(false);
                    if (this._active.client.address === '0x' + argv[0]) {
                        this._active.client.updateProperty('class', '');
                        this._active.client.updateProperty('title', '');
                        this._active.client.updateProperty('address', '');
                        this._active.client.emit('changed');
                    }
                    ['clients', 'workspaces'].forEach(e => this.notify(e));
                    this.emit('client-removed', '0x' + argv[0]);
                    break;

                case 'urgent':
                    this.emit('urgent-window', '0x' + argv[0]);
                    break;

                case 'activelayout':
                    this.emit('keyboard-layout', `${argv[0]}`, `${argv[1]}`);
                    break;

                case 'changefloatingmode': {
                    await this._syncClients();
                    break;
                }
                case 'submap':
                    this.emit('submap', argv[0]);
                    break;

                default:
                    break;
            }
        } catch (error) {
            if (error instanceof Error)
                console.error(error.message);
        }

        this.emit('event', e, params);
        this.emit('changed');
    }
}

export interface Monitor {
    id: number,
    name: string,
    description: string,
    make: string,
    model: string,
    serial: string,
    width: number,
    height: number,
    refreshRate: number
    x: number
    y: number
    activeWorkspace: {
        id: number
        name: string
    }
    specialWorkspace: {
        id: number
        name: string
    },
    reserved: [
        number,
        number,
        number,
        number,
    ]
    scale: number
    transform: number
    focused: boolean
    dpmsStatus: boolean
    vrr: boolean
    activelyTearing: boolean
}

export interface Workspace {
    id: number
    name: string
    monitor: string
    monitorID: number
    windows: number
    hasfullscreen: boolean
    lastwindow: string
    lastwindowtitle: string
}

export interface Client {
    address: string
    mapped: boolean
    hidden: boolean
    at: [number, number]
    size: [number, number]
    workspace: {
        id: number
        name: string
    }
    floating: boolean
    monitor: number
    class: string
    title: string
    initialClass: string
    initialTitle: string
    pid: number
    xwayland: boolean
    pinned: boolean
    fullscreen: boolean
    fullscreenMode: number
    fakeFullscreen: boolean
    grouped: [string],
    swallowing: string
    focusHistoryID: number
}

export const hyprland = new Hyprland;
export default hyprland;
