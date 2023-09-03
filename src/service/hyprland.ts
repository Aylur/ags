import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from './service.js';
import { execAsync } from '../utils.js';

const HIS = GLib.getenv('HYPRLAND_INSTANCE_SIGNATURE');

interface Active {
    client: {
        address: string
        title: string
        class: string
    }
    monitor: string
    workspace: {
        id: number
        name: string
    }
}

class HyprlandService extends Service {
    static {
        Service.register(this, {
            'urgent-window': ['string'],
            'submap': ['string'],
            'keyboard-layout': ['string', 'string'],
        });
    }

    private _active: Active;
    private _monitors: Map<number, object>;
    private _workspaces: Map<number, object>;
    private _clients: Map<string, object>;
    private _decoder = new TextDecoder();

    get active() { return this._active; }
    get monitors() { return this._monitors; }
    get workspaces() { return this._workspaces; }
    get clients() { return this._clients; }

    constructor() {
        if (!HIS)
            console.error('Hyprland is not running');

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

        this._watchSocket(new Gio.DataInputStream({
            close_base_stream: true,
            base_stream: new Gio.SocketClient()
                .connect(new Gio.UnixSocketAddress({
                    path: `/tmp/hypr/${HIS}/.socket2.sock`,
                }), null)
                .get_input_stream(),
        }));
    }

    private _watchSocket(stream: Gio.DataInputStream) {
        stream.read_line_async(
            0, null,
            (stream, result) => {
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
                    this._active.monitor = monitor.name;
                    this._active.workspace = monitor.activeWorkspace;
                }
            });
        } catch (error) {
            logError(error as Error);
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
        } catch (error) {
            logError(error as Error);
        }
    }

    private async _syncClients() {
        try {
            const clients = await execAsync('hyprctl -j clients');
            this._clients = new Map();
            const json = JSON.parse(clients) as { address: string }[];
            json.forEach(client => {
                this._clients.set(
                    client.address.substring(2), client);
            });
        } catch (error) {
            logError(error as Error);
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
                    await this._syncWorkspaces();
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
                    await this._syncWorkspaces();
                    break;

                case 'urgent':
                    this.emit('urgent-window', argv[0]);
                    break;

                case 'activelayout':
                    this.emit('keyboard-layout', `${argv[0]}`, `${argv[1]}`);
                    break;

                case 'changefloating': {
                    const client = this._clients.get(argv[0]);
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
            logError(error as Error);
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

    static get active() { return Hyprland.instance.active; }
    static get monitors() { return Hyprland.instance.monitors; }
    static get workspaces() { return Hyprland.instance.workspaces; }
    static get clients() { return Hyprland.instance.clients; }

    static HyprctlGet(cmd: string): unknown | object {
        const [success, out, err] =
            GLib.spawn_command_line_sync(`hyprctl -j ${cmd}`);

        const decoder = new TextDecoder();
        if (!success)
            throw `Error spawning hyprctl: ${decoder.decode(err)}`;

        return JSON.parse(decoder.decode(out));
    }
}
