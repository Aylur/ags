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
    EVENT_WORKSPACE = 0x8000000,
    EVENT_MODE = 0x80000002,
    EVENT_WINDOW =  0x80000003,
    EVENT_BARCONFIG_UPDATE = 0x80000004,
    EVENT_BINDING = 0x80000005,
    EVENT_SHUTDOWN = 0x80000006,
    EVENT_TICK =  0x80000007,
    EVENT_BAR_STATE_UPDATE = 0x80000014,
    EVENT_INPUT = 0x80000015,
}

class SwayService extends Service {
    static {
        Service.register(this);
    }

    private _decoder = new TextDecoder();
    private _encoder = new TextEncoder();
    private _output_stream: Gio.OutputStream;

    constructor() {
        if (!SIS)
            console.error('Sway is not running');
        super();
        const socket = new Gio.SocketClient().connect(new Gio.UnixSocketAddress({
            path: `${SIS}`,
        }), null);

        this._watchSocket(socket.get_input_stream());

        this._output_stream = socket.get_output_stream();
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
        print(data);
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

    private async _onEvent(event_type: PAYLOAD_TYPE, event: string) {
        if (!event)
            return;
        try {
            switch (event_type) {
                case PAYLOAD_TYPE.EVENT_WORKSPACE:
                    break;
                case PAYLOAD_TYPE.EVENT_WINDOW:
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

export default class Sway {
    static _instance: SwayService;

    static get instance() {
        Service.ensureInstance(Sway, SwayService);
        return Sway._instance;
    }
}
