import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from './service.js';

const SIS = GLib.getenv('SWAYSOCK');

const enum PAYLOAD_TYPE {
    MESSAGE_RUM_COMMAND = 0,
    MESSAGE_GET_WORKSPACES = 1,
    MESSAGE_SUBSCRIBE = 2,
    MESSAGE_GET_OUTPUTS = 3,
    MESSAGE_GET_TREE = 4,
    MESSAGE_GET_MARKS = 5,
    MESSAGE_GET_BAR_CONFIG = 6,
    MESSAGE_GET_VERSION = 7,
    MESSAGE_GET_BINDING_NODES = 8,
    MESSAGE_GET_CONFIG = 9,
    MESSAGE_SEND_TICK = 10,
    MESSAGE_SYNC = 11,
    MESSAGE_GET_BINDING_STATE = 12,
    MESSAGE_GET_INPUTS = 100,
    MESSAGE_GET_SEATS = 101,
    EVENT_WORKSPACE = 0x80000000,
    EVENT_MODE = 0x80000002,
    EVENT_WINDOW =  0x80000003,
    EVENT_BARCONFIG_UPDATE = 0x80000004,
    EVENT_BINDING = 0x80000005,
    EVENT_SHUTDOWN = 0x80000006,
    EVENT_TICK =  0x80000007,
    EVENT_BAR_STATE_UPDATE = 0x80000014,
    EVENT_INPUT = 0x80000015,
}

interface Client_Event {
    change: string,
    container: Node,
}

interface Workspace_Event {
    change: string,
    current: Node,
    old: Node,
}

interface Geometry {
    x: number,
    y: number,
    width: number,
    height: number,
}

//NOTE: not all properties are listed here
interface Node {
    id: number,
    name: string,
    type: string,
    border: string
    current_border_width: number
    layout:  string
    orientation: string
    percent: number
    rect: Geometry
    window_rect: Geometry
    deco_rect: Geometry
    geometry: Geometry
    urgent: boolean
    sticky: boolean
    marks: [string]
    focused: boolean
    focus: [number]
    nodes: [Node]
    floating_nodes: [Node]
    representation: string
    fullscreen_mode: number
    app_id: string
    pid: number
    visible: boolean
    shell: string
    output: string,
    inhibit_idle: boolean
    idle_inhibitors: {
        application: string,
        user: string,
    }
    window: number
    window_properties: {
        title: string,
        class: string,
        instance: string,
        window_role: string,
        window_type: string,
        transient_for: string,
    }
}

interface Active {
    client: {
        id: number
        title: string
        class: string
    }
    monitor: string
    workspace: {
        id: number
        name: string
    }
}

class SwayService extends Service {
    static {
        Service.register(this);
    }

    private _decoder = new TextDecoder();
    private _encoder = new TextEncoder();
    private _output_stream: Gio.OutputStream;

    private _active: Active;
    private _monitors: Map<number, object>;
    private _workspaces: Map<number, object>;
    private _clients: Map<number, Node>;

    get active() { return this._active; }
    get monitors() { return this._monitors; }
    get workspaces() { return this._workspaces; }
    get clients() { return this._clients; }

    constructor() {
        if (!SIS)
            console.error('Sway is not running');
        super();

        this._active = {
            client: {
                id: 0,
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

        const socket = new Gio.SocketClient().connect(new Gio.UnixSocketAddress({
            path: `${SIS}`,
        }), null);

        this._watchSocket(socket.get_input_stream());

        this._output_stream = socket.get_output_stream();
        //TODO init everything by mybe using get_tree
        this.send(PAYLOAD_TYPE.MESSAGE_SUBSCRIBE, JSON.stringify(['window', 'workspace']));
    }

    send(payload_type: PAYLOAD_TYPE, payload: string) {
        const pb = this._encoder.encode(payload);
        const type = new Uint32Array([payload_type]);
        const pl = new Uint32Array([pb.length]);
        const magic_string = this._encoder.encode('i3-ipc');
        const data = new Uint8Array([
            ...magic_string,
            ...(new Uint8Array(pl.buffer)),
            ...(new Uint8Array(type.buffer)),
            ...pb]);
        this._output_stream.write_bytes(data, null);
    }

    private _watchSocket(stream: Gio.InputStream) {
        stream.read_bytes_async(14, GLib.PRIORITY_DEFAULT, null, (_, result_header) => {
            const data = stream.read_bytes_finish(result_header).get_data();
            if (!data)
                return;
            const payload_length = new Uint32Array(data.slice(6, 10).buffer)[0];
            const payload_type = new Uint32Array(data.slice(10, 14).buffer)[0];
            stream.read_bytes_async(
                payload_length,
                GLib.PRIORITY_DEFAULT,
                null,
                (_, result_payload) => {
                    const data = stream.read_bytes_finish(result_payload).get_data();
                    if (!data)
                        return;
                    this._onEvent(payload_type, JSON.parse(this._decoder.decode(data)));
                    this._watchSocket(stream);
                });
        });
    }

    private async _onEvent(event_type: PAYLOAD_TYPE, event: object) {
        if (!event)
            return;
        try {
            switch (event_type) {
                case PAYLOAD_TYPE.EVENT_WORKSPACE:
                    this._handle_workspace_event(event as Workspace_Event);
                    break;
                case PAYLOAD_TYPE.EVENT_WINDOW:
                    this._handle_window_event(event as Client_Event);
                    break;
                default:
                    break;
            }
        } catch (error) {
            logError(error as Error);
        }
        this.emit('changed');
    }

    private _handle_workspace_event(workspace_event: Workspace_Event) {
        const workspace = workspace_event.current;
        switch (workspace_event.change) {
            case 'init':
                this._workspaces.set(workspace.id, workspace);
                break;
            case 'empty':
                this._workspaces.delete(workspace.id);
                break;
            case 'focus':
                this._active.workspace.id = workspace.id;
                this._active.workspace.name = workspace.name;
                this._active.monitor = workspace.output;
                this._workspaces.set(workspace.id, workspace);
                this._workspaces.set(workspace_event.old.id, workspace_event.old);
                break;
            case 'rename':
                if (this._active.workspace.id === workspace.id)
                    this._active.workspace.name = workspace.name;
                this._workspaces.set(workspace.id, workspace);
                break;
            case 'reload':
                break;
            case 'move':
            case 'urgent':
            default:
                this._workspaces.set(workspace.id, workspace);
        }
    }

    private _handle_window_event(client_event: Client_Event) {
        const client = client_event.container;
        const id = client.id;
        switch (client_event.change) {
            case 'new':
                this._clients.set(id, client);
                break;
            case 'close':
                this._clients.delete(id);
                break;
            case 'focus':
                if (this._active.client.id === id)
                    return;
                // eslint-disable-next-line no-case-declarations
                const current_active = this._clients.get(this._active.client.id);
                if (current_active)
                    current_active.focused = false;
                this._active.client.id = id;
                this._active.client.title = client.name;
                this._active.client.class = client.shell === 'xwayland'
                    ? client.window_properties?.class || ''
                    : client.app_id;
                break;
            case 'title':
                if (client.focused)
                    this._active.client.title = client.name;
                this._clients.set(id, client);
                break;
            case 'fullscreen_mode':
            case 'move':
            case 'floating':
            case 'urgent':
            case 'mark':
            default:
                this._clients.set(id, client);
        }
    }
}

export default class Sway {
    static _instance: SwayService;

    static get instance() {
        Service.ensureInstance(Sway, SwayService);
        return Sway._instance;
    }

    static get monitors() { return Array.from(Sway.instance.monitors.values()); }
    static get workspaces() { return Array.from(Sway.instance.workspaces.values()); }
    static get clients() { return Array.from(Sway.instance.clients.values()); }
    static get active() { return Sway.instance.active; }
}
