import GLib from 'gi://GLib';
import Service from './service.js';
import { error, execAsync, subprocess } from '../utils.js';

const HIS = GLib.getenv('HYPRLAND_INSTANCE_SIGNATURE');

type ActiveWorkspace = {
    id: number
    name: string
}

type Monitor = {
    id: number
    name: string
    focused: boolean
    activeWorkspace: ActiveWorkspace
}

type Workspace = {
    id: number
    name: string
    windows: number
    monitor: string
}

type Client = {
    address: string
    pid: number
    workspace: ActiveWorkspace
    monitor: number
    class: string
    title: string
    floating: boolean
}

type Active = {
    client: {
        address: string
        title: string
        class: string
    }
    monitor: string
    workspace: ActiveWorkspace
}

class HyprlandService extends Service {
    static {
        Service.register(this, {
            'urgent-window': ['int'],
            'submap': ['string'],
            'keyboard-layout': ['string', 'string'],
        });
    }

    _active: Active;
    _monitors: Map<string, Monitor>;
    _workspaces: Map<number, Workspace>;
    _clients: Map<string, Client>;

    constructor() {
        if (!HIS)
            error('Hyprland is not running');

        super();
        this._active = {
            client: {
                address: '',
                title: '',
                class: '',
            },
            monitor: '',
            workspace: {
                id: 0,
                name: '',
            },
        };
        this._monitors = new Map();
        this._workspaces = new Map();
        this._clients = new Map();
        this._syncMonitors();
        this._syncWorkspaces();
        this._syncClients();

        // using Gio for socket reading sometimes misses events
        // so for now the best solution I found was using socat
        const socat = `socat -U - UNIX-CONNECT:/tmp/hypr/${HIS}/.socket2.sock`;
        subprocess(['bash', '-c', socat], line => {
            this._onEvent(line);
        });
    }

    async _syncMonitors() {
        try {
            const monitors = await execAsync('hyprctl -j monitors');
            this._monitors = new Map();
            (JSON.parse(monitors as string) as Monitor[]).forEach(monitor => {
                this._monitors.set(monitor.name, monitor);
                if (monitor.focused) {
                    this._active.monitor = monitor.name;
                    this._active.workspace = monitor.activeWorkspace;
                }
            });
        } catch (error) {
            logError(error as Error);
        }
    }

    async _syncWorkspaces() {
        try {
            const workspaces = await execAsync('hyprctl -j workspaces');
            this._workspaces = new Map();
            (JSON.parse(workspaces as string) as Workspace[]).forEach(ws => {
                this._workspaces.set(ws.id, ws);
            });
        } catch (error) {
            logError(error as Error);
        }
    }

    async _syncClients() {
        try {
            const clients = await execAsync('hyprctl -j clients');
            this._clients = new Map();
            (JSON.parse(clients as string) as Client[]).forEach(c => {
                const {
                    address,
                    pid,
                    workspace,
                    monitor,
                    class: cClass,
                    title,
                    floating,
                } = c;

                this._clients.set(address.substring(2), {
                    address,
                    pid,
                    workspace,
                    monitor,
                    class: cClass,
                    title,
                    floating,
                });
            });
        } catch (error) {
            logError(error as Error);
        }
    }

    async _onEvent(event: string) {
        if (!event)
            return;

        const [e, params] = event.split('>>');
        const argv = params.split(',');

        try {
            switch (e) {
            case 'workspace':
            case 'focusedmon':
            case 'monitorremoved':
            case 'monitoradded':
                await this._syncMonitors();
                break;

            case 'createworkspace':
            case 'destroyworkspace':
                await this._syncWorkspaces();
                break;

            case 'openwindow':
            case 'movewindow':
            case 'windowtitle':
                await this._syncClients();
                break;

            case 'moveworkspace':
                await this._syncWorkspaces();
                await this._syncMonitors();
                break;

            case 'activewindow':
                this._active.client.class = argv[0];
                this._active.client.title = argv[1];
                break;

            case 'activewindowv2':
                this._active.client.address = argv[0];
                break;

            case 'closewindow':
                this._active.client = {
                    class: '',
                    title: '',
                    address: '',
                };
                await this._syncClients();
                break;

            case 'urgent':
                this.emit('urgent-window', argv[0]);
                break;

            case 'activelayout': {
                const [kbName, layoutName] = argv[0].split(',');
                this.emit('keyboard-layout', `${kbName}`, `${layoutName}`);
                break;
            }
            case 'changefloating': {
                const client = this._clients.get(argv[0]);
                if (client)
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
            logError(error as Error);
        }

        this.emit('changed');
    }
}

export default class Hyprland {
    static { Service.export(this, 'Hyprland'); }
    static _instance: HyprlandService;

    static get instance() {
        Service.ensureInstance(Hyprland, HyprlandService);
        return Hyprland._instance;
    }

    static get active() { return Hyprland.instance._active; }
    static get monitors() { return Hyprland.instance._monitors; }
    static get workspaces() { return Hyprland.instance._workspaces; }
    static get clients() { return Hyprland.instance._clients; }

    static HyprctlGet(cmd: string): unknown | object {
        const [success, out, err] =
            GLib.spawn_command_line_sync(`hyprctl -j ${cmd}`);

        const decoder = new TextDecoder();
        if (!success)
            throw `Error spawning hyprctl: ${decoder.decode(err)}`;

        return JSON.parse(decoder.decode(out));
    }
}
