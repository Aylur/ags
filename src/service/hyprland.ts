import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from '../service.js';

Gio._promisify(Gio.DataInputStream.prototype, 'read_upto_async');
const HIS = GLib.getenv('HYPRLAND_INSTANCE_SIGNATURE');

const socket = (path: string) => new Gio.SocketClient()
    .connect(new Gio.UnixSocketAddress({ path }), null);

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

    updateProperty(prop: 'address' | 'title' | 'class', value: unknown) {
        super.updateProperty(prop, value);
        this.emit('changed');
    }
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
        this.emit('changed');
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
            'client-added': ['string'],
            'client-removed': ['string'],
            'workspace-added': ['string'],
            'workspace-removed': ['string'],
            'fullscreen': ['boolean'],
        }, {
            'active': ['jsobject'],
            'monitors': ['jsobject'],
            'workspaces': ['jsobject'],
            'clients': ['jsobject'],
        });
    }

    private _active: Actives;
    private _monitors: Map<number, object>;
    private _workspaces: Map<number, object>;
    private _clients: Map<string, object>;
    private _decoder = new TextDecoder();
    private _encoder = new TextEncoder();

    get active() { return this._active; }
    get monitors() { return Array.from(this._monitors.values()); }
    get workspaces() { return Array.from(this._workspaces.values()); }
    get clients() { return Array.from(this._clients.values()); }

    getMonitor(id: number) { return this._monitors.get(id); }
    getWorkspace(id: number) { return this._workspaces.get(id); }
    getClient(address: string) { return this._clients.get(address); }

    constructor() {
        if (!HIS)
            console.error('Hyprland is not running');

        super();
        this._active = new Actives();
        this._monitors = new Map();
        this._workspaces = new Map();
        this._clients = new Map();
        this._syncMonitors();
        this._syncWorkspaces();
        this._syncClients();

        this._watchSocket(new Gio.DataInputStream({
            close_base_stream: true,
            base_stream: socket(`/tmp/hypr/${HIS}/.socket2.sock`)
                .get_input_stream(),
        }));

        this._active.connect('changed', () => this.emit('changed'));
        ['monitor', 'workspace', 'client'].forEach(active =>
            this._active.connect(`notify::${active}`, () => this.changed('active')));
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

    async sendMessage(cmd: string) {
        const connection = socket(`/tmp/hypr/${HIS}/.socket.sock`);

        connection
            .get_output_stream()
            .write(this._encoder.encode(cmd), null);

        const inputStream = new Gio.DataInputStream({
            close_base_stream: true,
            base_stream: connection.get_input_stream(),
        });

        return inputStream.read_upto_async('\x04', -1, 0, null)
            .then(result => {
                const [response] = result as unknown as [string, number];
                connection.close(null);
                return response;
            });
    }

    private async _syncMonitors() {
        try {
            const msg = await this.sendMessage('j/monitors');
            this._monitors = new Map();
            (JSON.parse(msg) as Array<Monitor>).forEach(monitor => {
                const { activeWorkspace } = monitor;
                this._monitors.set(monitor.id, monitor);
                if (monitor.focused) {
                    this._active.monitor.update(monitor.id, monitor.name);
                    this._active.workspace.update(activeWorkspace.id, activeWorkspace.name);
                }
            });
            this.notify('monitors');
        } catch (error) {
            logError(error);
        }
    }

    private async _syncWorkspaces() {
        try {
            const msg = await this.sendMessage('j/workspaces');
            this._workspaces = new Map();
            (JSON.parse(msg) as Array<Workspace>).forEach(ws => {
                this._workspaces.set(ws.id, ws);
            });
            this.notify('workspaces');
        } catch (error) {
            logError(error);
        }
    }

    private async _syncClients() {
        try {
            const msg = await this.sendMessage('j/clients');
            this._clients = new Map();
            (JSON.parse(msg) as Array<Client>).forEach(client => {
                this._clients.set(client.address, client);
            });
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

        this.emit('event', e, params);

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
                    await this._syncClients();
                    await this._syncWorkspaces();
                    this.emit('client-added', '0x' + argv[0]);
                    break;

                case 'movewindow':
                case 'windowtitle':
                    await this._syncClients();
                    await this._syncWorkspaces();
                    break;

                case 'moveworkspace':
                    await this._syncWorkspaces();
                    await this._syncMonitors();
                    break;

                case 'fullscreen':
                    await this._syncClients();
                    await this._syncWorkspaces();
                    this.emit('fullscreen', argv[0] === '1');
                    break;

                case 'activewindow':
                    this._active.client.updateProperty('class', argv[0]);
                    this._active.client.updateProperty('title', argv.slice(1).join(','));
                    break;

                case 'activewindowv2':
                    this._active.client.updateProperty('address', '0x' + argv[0]);
                    break;

                case 'closewindow':
                    this._active.client.updateProperty('class', '');
                    this._active.client.updateProperty('title', '');
                    this._active.client.updateProperty('address', '');
                    await this._syncWorkspaces();
                    this._clients.delete('0x' + argv[0]);
                    this.emit('client-removed', '0x' + argv[0]);
                    this.notify('clients');
                    break;

                case 'urgent':
                    this.emit('urgent-window', '0x' + argv[0]);
                    break;

                case 'activelayout':
                    this.emit('keyboard-layout', `${argv[0]}`, `${argv[1]}`);
                    break;

                case 'changefloatingmode': {
                    const client = this._clients.get('0x' + argv[0]);
                    if (client)
                        // @ts-expect-error
                        client.floating = argv[1] === '1';
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

        this.emit('changed');
    }
}

interface Monitor {
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

interface Workspace {
    id: number
    name: string
    monitor: string
    monitorID: number
    windows: number
    hasfullscreen: boolean
    lastwindow: string
    lastwindowtitle: string
}

interface Client {
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
