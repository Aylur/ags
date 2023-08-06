import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from './service.js';
import { error, execAsync, warning } from '../utils.js';

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

type HyprlandState = {
    active: Active
    monitors: Map<string, Monitor>
    workspaces: Map<number, Workspace>
    clients: Map<string, Client>
}

class HyprlandService extends Service {
    static {
        Service.register(this, {
            'urgent-window': ['int'],
            'keyboard-layout': ['string', 'string'],
        });
    }

    _state!: HyprlandState;

    constructor() {
        if (!HIS)
            error('Hyprland is not running');

        super();
        this._state = {
            active: {
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
            },
            monitors: new Map(),
            workspaces: new Map(),
            clients: new Map(),
        };

        this._sync();
        this._startSocat();
    }

    async _sync() {
        try {
            const monitors = await execAsync('hyprctl -j monitors');
            this._state.monitors = new Map();
            (JSON.parse(monitors as string) as Monitor[]).forEach(monitor => {
                this._state.monitors.set(monitor.name, monitor);
                if (monitor.focused) {
                    this._state.active.monitor = monitor.name;
                    this._state.active.workspace = monitor.activeWorkspace;
                }
            });

            const workspaces = await execAsync('hyprctl -j workspaces');
            this._state.workspaces = new Map();
            (JSON.parse(workspaces as string) as Workspace[]).forEach(ws => {
                this._state.workspaces.set(ws.id, ws);
            });

            const clients = await execAsync('hyprctl -j clients');
            this._state.clients = new Map();
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

                this._state.clients.set(address.substring(2), {
                    address,
                    pid,
                    workspace,
                    monitor,
                    class: cClass,
                    title,
                    floating,
                });
            });

            this.emit('changed');
        } catch (error) {
            print(error);
        }
    }

    _onEvent(event: string) {
        if (!event)
            return;

        const [e, params] = event.split('>>');
        const argv = params.split(',');

        switch (e) {
        case 'activewindow':
            this._state.active.client.class = argv[0];
            this._state.active.client.title = argv[1];
            break;

        case 'activewindowv2':
            this._state.active.client.address = argv[0];
            break;

        case 'closewindow':
            this._state.active.client = {
                class: '',
                title: '',
                address: '',
            };
            this._sync();
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
            const client = this._state.clients.get(argv[0]);
            if (client)
                client.floating = argv[1] === '1';
            break;
        }
        default:
            this._sync();
            break;
        }

        this.emit('changed');
    }

    _startSocat() {
        try {
            const socat = `
            socat -U - UNIX-CONNECT:/tmp/hypr/${HIS}/.socket2.sock | while read lines
            do 
                echo $lines
            done`;

            const proc = Gio.Subprocess.new(
                ['bash', '-c', socat],
                Gio.SubprocessFlags.STDOUT_PIPE,
            );

            const pipe = proc.get_stdout_pipe();
            if (!pipe) {
                warning('socat error');
                return;
            }

            const stdout = new Gio.DataInputStream({
                base_stream: pipe,
                close_base_stream: true,
            });

            this._readSocat(stdout);
        } catch (e) {
            logError(e as Error);
        }
    }

    _readSocat(stdout: Gio.DataInputStream) {
        stdout.read_line_async(GLib.PRIORITY_LOW, null, (stdout, res) => {
            try {
                const line = stdout?.read_line_finish_utf8(res)[0];
                if (line) {
                    this._onEvent(line);
                    this._readSocat(stdout);
                }
            } catch (e) {
                logError(e as Error);
            }
        });
    }
}

export default class Hyprland {
    static { Service.export(this, 'Hyprland'); }
    static _instance: HyprlandService;

    static get instance() {
        Service.ensureInstance(Hyprland, HyprlandService);
        return Hyprland._instance;
    }

    static get active() { return Hyprland.instance._state.active; }
    static get monitors() { return Hyprland.instance._state.monitors; }
    static get workspaces() { return Hyprland.instance._state.workspaces; }
    static get clients() { return Hyprland.instance._state.clients; }

    static HyprctlGet(cmd: string): unknown | object {
        const [success, out, err] =
            GLib.spawn_command_line_sync(`hyprctl -j ${cmd}`);

        const decoder = new TextDecoder();
        if (!success)
            throw `Error spawning hyprctl: ${decoder.decode(err)}`;

        return JSON.parse(decoder.decode(out));
    }
}
