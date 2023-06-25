import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
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
            'urgent-window': [GObject.TYPE_INT],
            'keyboard-layout': [GObject.TYPE_STRING, GObject.TYPE_STRING],
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

    _hyrpctlErrHandle(error: string) {
        warning(`hyprctl ERROR: ${error}`);
    }

    _sync() {
        execAsync('hyprctl -j monitors', out => {
            const monitors = JSON.parse(out) as Monitor[];
            this._state.monitors = new Map();
            monitors.forEach(monitor => {
                this._state.monitors.set(monitor.name, monitor);
                if (monitor.focused) {
                    this._state.active.monitor = monitor.name;
                    this._state.active.workspace = monitor.activeWorkspace;
                }
            });
            this.emit('changed');
        }, this._hyrpctlErrHandle.bind(this));

        execAsync('hyprctl -j workspaces', out => {
            const workspaces = JSON.parse(out) as Workspace[];
            this._state.workspaces = new Map();
            workspaces.forEach(ws => {
                this._state.workspaces.set(ws.id, ws);
            });
            this.emit('changed');
        }, this._hyrpctlErrHandle.bind(this));

        execAsync('hyprctl -j clients', out => {
            const clients = JSON.parse(out) as Client[];
            this._state.clients = new Map();
            clients.forEach(c => {
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
        });
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

    static connect(widget: Gtk.Widget, callback: () => void) {
        Service.ensureInstance(Hyprland, HyprlandService);
        Hyprland._instance.listen(widget, callback);
    }

    static get state() {
        Service.ensureInstance(Hyprland, HyprlandService);
        return Hyprland._instance._state;
    }

    static Hyprctl(cmd: string) {
        execAsync(`hyprctl ${cmd}`);
    }

    static HyprctlGet(cmd: string): unknown|object {
        const [success, out, err] =
            GLib.spawn_command_line_sync(`hyprctl -j ${cmd}`);

        const decoder = new TextDecoder();
        if (!success)
            throw `Error spawning hyprctl: ${decoder.decode(err)}`;

        return JSON.parse(decoder.decode(out));
    }
}
