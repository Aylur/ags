import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from './service.js';
import { execAsync } from '../utils.js';

const HIS = GLib.getenv('HYPRLAND_INSTANCE_SIGNATURE');

class Active extends Service {
    updateProperty(prop: string, value: unknown): void {
        super.updateProperty(prop, value);
        this.emit('changed');
    }
}

class ActiveClient extends Active {
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

class ActiveWorkspace extends Active {
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
}

class Actives extends Service {
    static {
        Service.register(this, {}, {
            'client': ['jsobject'],
            'monitor': ['string'],
            'workspace': ['jsobject'],
        });
    }

    constructor() {
        super();

        [this._client, this._workspace].forEach(s =>
            s.connect('changed', () => this.emit('changed')));

        ['id', 'name'].forEach(attr =>
            this._workspace.connect(`notify::${attr}`, () => this.changed('workspace')));

        ['address', 'title', 'class'].forEach(attr =>
            this._client.connect(`notify::${attr}`, () => this.changed('client')));
    }

    private _client = new ActiveClient();
    private _monitor = '';
    private _workspace = new ActiveWorkspace();

    get client() { return this._client; }
    get monitor() { return this._monitor; }
    get workspace() { return this._workspace; }
}

class HyprlandService extends Service {
    static {
        Service.register(this, {
            'urgent-window': ['string'],
            'submap': ['string'],
            'keyboard-layout': ['string', 'string'],
            'monitor-added': ['string'],
            'monitor-removed': ['string'],
            'client-added': ['string'],
            'client-removed': ['string'],
            'workspace-added': ['string'],
            'workspace-removed': ['string'],
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
            base_stream: new Gio.SocketClient()
                .connect(new Gio.UnixSocketAddress({
                    path: `/tmp/hypr/${HIS}/.socket2.sock`,
                }), null)
                .get_input_stream(),
        }));

        this._active.connect('changed', () => this.emit('changed'));
        ['monitor', 'workspace', 'client'].forEach(active =>
            this._active.connect(`notify::${active}`, () => this.changed('active')));
    }

    private _watchSocket(stream: Gio.DataInputStream) {
        stream.read_line_async(0, null, (stream, result) => {
            if (!stream) {
                console.error('Error reading Hyprland socket');
                return;
            }

            const [line] = stream.read_line_finish(result);
            this._onEvent(this._decoder.decode(line));
            this._watchSocket(stream);
        });
    }

    private async _syncMonitors() {
        try {
            const monitors = await execAsync('hyprctl -j monitors');
            this._monitors = new Map();
            const json = JSON.parse(monitors) as {
                id: number
                name: string
                focused: boolean
                activeWorkspace: {
                    id: number
                    name: string
                }
            }[];
            json.forEach(monitor => {
                this._monitors.set(monitor.id, monitor);
                if (monitor.focused) {
                    this._active.updateProperty('monitor', monitor.name);
                    this._active.workspace.updateProperty('id', monitor.activeWorkspace.id);
                    this._active.workspace.updateProperty('name', monitor.activeWorkspace.name);
                }
            });
            this.notify('monitors');
        } catch (error) {
            console.error(error as Error);
        }
    }

    private async _syncWorkspaces() {
        try {
            const workspaces = await execAsync('hyprctl -j workspaces');
            this._workspaces = new Map();
            const json = JSON.parse(workspaces) as { id: number }[];
            json.forEach(ws => {
                this._workspaces.set(ws.id, ws);
            });
            this.notify('workspaces');
        } catch (error) {
            console.error(error as Error);
        }
    }

    private async _syncClients() {
        try {
            const clients = await execAsync('hyprctl -j clients');
            this._clients = new Map();
            const json = JSON.parse(clients) as { address: string }[];
            json.forEach(client => {
                this._clients.set(client.address, client);
            });
            this.notify('clients');
        } catch (error) {
            console.error(error as Error);
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
                    await this._syncClients();
                    await this._syncWorkspaces();
                    this.emit('client-removed', '0x' + argv[0]);
                    break;

                case 'urgent':
                    this.emit('urgent-window', '0x' + argv[0]);
                    break;

                case 'activelayout':
                    this.emit('keyboard-layout', `${argv[0]}`, `${argv[1]}`);
                    break;

                case 'changefloating': {
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
            console.error(error as Error);
        }

        this.emit('changed');
    }
}

export default class Hyprland {
    static _instance: HyprlandService;

    static get instance() {
        Service.ensureInstance(Hyprland, HyprlandService);
        return Hyprland._instance;
    }

    static getMonitor(id: number) { return Hyprland.instance.getMonitor(id); }
    static getWorkspace(id: number) { return Hyprland.instance.getWorkspace(id); }
    static getClient(address: string) { return Hyprland.instance.getClient(address); }

    static get monitors() { return Hyprland.instance.monitors; }
    static get workspaces() { return Hyprland.instance.workspaces; }
    static get clients() { return Hyprland.instance.clients; }
    static get active() { return Hyprland.instance.active; }

    static HyprctlGet(cmd: string): unknown | object {
        console.error('Hyprland.HyprctlGet is DEPRECATED' +
            "use JSON.parse(Utils.exec('hyprctl -j')) instead");

        const [success, out, err] =
            GLib.spawn_command_line_sync(`hyprctl -j ${cmd}`);

        const decoder = new TextDecoder();
        if (!success)
            throw `Error spawning hyprctl: ${decoder.decode(err)}`;

        return JSON.parse(decoder.decode(out));
    }
}
