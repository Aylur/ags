import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from '../service.js';

const SIS = GLib.getenv('SWAYSOCK');

export const enum PAYLOAD_TYPE {
    MESSAGE_RUN_COMMAND = 0,
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
    EVENT_WINDOW = 0x80000003,
    EVENT_BARCONFIG_UPDATE = 0x80000004,
    EVENT_BINDING = 0x80000005,
    EVENT_SHUTDOWN = 0x80000006,
    EVENT_TICK = 0x80000007,
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
export interface Node {
    id: number,
    name: string,
    type: string,
    border: string
    current_border_width: number
    layout: string
    orientation: string
    percent: number
    rect: Geometry
    window_rect: Geometry
    deco_rect: Geometry
    geometry: Geometry
    urgent: boolean
    sticky: boolean
    marks: string[]
    focused: boolean
    active: boolean
    focus: number[]
    nodes: Node[]
    floating_nodes: Node[]
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

export class SwayActiveClient extends Service {
    static {
        Service.register(this, {}, {
            'id': ['int'],
            'name': ['string'],
            'class': ['string'],
        });
    }

    private _id = 0;
    private _name = '';
    private _class = '';

    get id() { return this._id; }
    get name() { return this._name; }
    get class() { return this._class; }

    updateProperty(prop: 'id' | 'name' | 'class', value: unknown) {
        super.updateProperty(prop, value);
        this.emit('changed');
    }
}

export class SwayActiveID extends Service {
    static {
        Service.register(this, {}, {
            'id': ['int'],
            'name': ['string'],
        });
    }

    private _id = 0;
    private _name = '';

    get id() { return this._id; }
    get name() { return this._name; }

    update(id: number, name: string) {
        super.updateProperty('id', id);
        super.updateProperty('name', name);
        this.emit('changed');
    }
}

export class SwayActives extends Service {
    static {
        Service.register(this, {}, {
            'client': ['jsobject'],
            'monitor': ['jsobject'],
            'workspace': ['jsobject'],
        });
    }

    private _client = new SwayActiveClient;
    private _monitor = new SwayActiveID;
    private _workspace = new SwayActiveID;

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

export class Sway extends Service {
    static {
        Service.register(this, {}, {
            'active': ['jsobject'],
            'monitors': ['jsobject'],
            'workspaces': ['jsobject'],
            'clients': ['jsobject'],
        });
    }

    private _decoder = new TextDecoder();
    private _encoder = new TextEncoder();
    private _socket: Gio.SocketConnection;

    private _active: SwayActives;
    private _monitors: Map<number, object>;
    private _workspaces: Map<string, object>;
    private _clients: Map<number, Node>;

    get active() { return this._active; }
    get monitors() { return Array.from(this._monitors.values()); }
    get workspaces() { return Array.from(this._workspaces.values()); }
    get clients() { return Array.from(this._clients.values()); }

    getMonitor(id: number) { return this._monitors.get(id); }
    getWorkspace(name: string) { return this._workspaces.get(name); }
    getClient(id: number) { return this._clients.get(id); }

    msg(payload: string) { this._send(PAYLOAD_TYPE.MESSAGE_RUN_COMMAND, payload); }

    constructor() {
        if (!SIS)
            console.error('Sway is not running');
        super();

        this._active = new SwayActives();
        this._monitors = new Map();
        this._workspaces = new Map();
        this._clients = new Map();

        this._socket = new Gio.SocketClient().connect(new Gio.UnixSocketAddress({
            path: `${SIS}`,
        }), null);

        this._watchSocket(this._socket.get_input_stream());
        this._send(PAYLOAD_TYPE.MESSAGE_GET_TREE, '');
        this._send(PAYLOAD_TYPE.MESSAGE_SUBSCRIBE, JSON.stringify(['window', 'workspace']));

        this._active.connect('changed', () => this.emit('changed'));
        ['monitor', 'workspace', 'client'].forEach(active =>
            this._active.connect(`notify::${active}`, () => this.notify('active')));
    }

    private _send(payloadType: PAYLOAD_TYPE, payload: string) {
        const pb = this._encoder.encode(payload);
        const type = new Uint32Array([payloadType]);
        const pl = new Uint32Array([pb.length]);
        const magic_string = this._encoder.encode('i3-ipc');
        const data = new Uint8Array([
            ...magic_string,
            ...(new Uint8Array(pl.buffer)),
            ...(new Uint8Array(type.buffer)),
            ...pb]);
        this._socket.get_output_stream().write(data, null);
    }

    private _watchSocket(stream: Gio.InputStream) {
        stream.read_bytes_async(14, GLib.PRIORITY_DEFAULT, null, (_, resultHeader) => {
            const data = stream.read_bytes_finish(resultHeader).get_data();
            if (!data)
                return;
            const payloadLength = new Uint32Array(data.slice(6, 10).buffer)[0];
            const payloadType = new Uint32Array(data.slice(10, 14).buffer)[0];
            stream.read_bytes_async(
                payloadLength,
                GLib.PRIORITY_DEFAULT,
                null,
                (_, resultPayload) => {
                    const data = stream.read_bytes_finish(resultPayload).get_data();
                    if (!data)
                        return;
                    this._onEvent(payloadType, JSON.parse(this._decoder.decode(data)));
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
                    this._handleWorkspaceEvent(event as Workspace_Event);
                    break;
                case PAYLOAD_TYPE.EVENT_WINDOW:
                    this._handleWindowEvent(event as Client_Event);
                    break;
                case PAYLOAD_TYPE.MESSAGE_GET_TREE:
                    this._handleTreeMessage(event as Node);
                    break;
                default:
                    break;
            }
        } catch (error) {
            logError(error as Error);
        }
        this.emit('changed');
    }

    private _handleWorkspaceEvent(workspaceEvent: Workspace_Event) {
        const workspace = workspaceEvent.current;
        switch (workspaceEvent.change) {
            case 'init':
                this._workspaces.set(workspace.name, workspace);
                break;
            case 'empty':
                this._workspaces.delete(workspace.name);
                break;
            case 'focus':
                this._active.workspace.update(workspace.id, workspace.name);
                this._active.monitor.update(1, workspace.output);

                this._workspaces.set(workspace.name, workspace);
                this._workspaces.set(workspaceEvent.old.name, workspaceEvent.old);
                break;
            case 'rename':
                if (this._active.workspace.id === workspace.id)
                    this._active.workspace.updateProperty('name', workspace.name);
                this._workspaces.set(workspace.name, workspace);
                break;
            case 'reload':
                break;
            case 'move':
            case 'urgent':
            default:
                this._workspaces.set(workspace.name, workspace);
        }
        this.notify('workspaces');
    }

    private _handleWindowEvent(clientEvent: Client_Event) {
        const client = clientEvent.container;
        const id = client.id;
        switch (clientEvent.change) {
            case 'new':
            case 'close':
            case 'floating':
            case 'move':
                // Refresh tree since client events don't contain the relevant information
                // to be able to modify `workspace.nodes` or `workspace.floating_nodes`.
                // There has to be a better way than this though :/
                this._send(PAYLOAD_TYPE.MESSAGE_GET_TREE, '');
                break;
            case 'focus':
                if (this._active.client.id === id)
                    return;
                // eslint-disable-next-line no-case-declarations
                const current_active = this._clients.get(this._active.client.id);
                if (current_active)
                    current_active.focused = false;
                this._active.client.updateProperty('id', id);
                this._active.client.updateProperty('name', client.name);
                this._active.client.updateProperty('class', client.shell === 'xwayland'
                    ? client.window_properties?.class || ''
                    : client.app_id,
                );
                break;
            case 'title':
                if (client.focused)
                    this._active.client.updateProperty('name', client.name);
                this._clients.set(id, client);
                this.notify('clients');
                break;
            case 'fullscreen_mode':
            case 'urgent':
            case 'mark':
            default:
                this._clients.set(id, client);
                this.notify('clients');
        }
    }

    private _handleTreeMessage(node: Node) {
        switch (node.type) {
            case 'root':
                this._workspaces.clear();
                this._clients.clear();
                this._monitors.clear();
                node.nodes.map(n => this._handleTreeMessage(n));
                break;
            case 'output':
                this._monitors.set(node.id, node);
                if (node.active)
                    this._active.monitor.update(node.id, node.name);
                node.nodes.map(n => this._handleTreeMessage(n));
                this.notify('monitors');
                break;
            case 'workspace':
                this._workspaces.set(node.name, node);
                // I think I'm missing something. There has to be a better way.
                // eslint-disable-next-line no-case-declarations
                const hasFocusedChild: (n: Node) => boolean =
                    (n: Node) => n.nodes.some(c => c.focused || hasFocusedChild(c));
                if (node.focused || hasFocusedChild(node))
                    this._active.workspace.update(node.id, node.name);

                node.nodes.map(n => this._handleTreeMessage(n));
                this.notify('workspaces');
                break;
            case 'con':
            case 'floating_con':
                this._clients.set(node.id, node);
                if (node.focused) {
                    this._active.client.updateProperty('id', node.id);
                    this._active.client.updateProperty('name', node.name);
                    this._active.client.updateProperty('class', node.shell === 'xwayland'
                        ? node.window_properties?.class || ''
                        : node.app_id,
                    );
                }
                node.nodes.map(n => this._handleTreeMessage(n));
                this.notify('clients');
                break;
        }
    }
}

export const sway = new Sway;
export default sway;
