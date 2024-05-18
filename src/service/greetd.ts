import App from '../app.js';
import Service from '../service.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

Gio._promisify(Gio.InputStream.prototype, 'read_bytes_async');
const SOCK = GLib.getenv('GREETD_SOCK');

type Request = {
    create_session: {
        username: string
    }
    post_auth_message_response: {
        response?: string
    }
    start_session: {
        cmd: string[]
        env: string[]
    }
    cancel_session: Record<never, never>
}

type Response = {
    type: 'success'
} | {
    type: 'error'
    error_type: 'auth_error' | 'error'
    description: string
} | {
    type: 'auth_message'
    auth_message_type: 'visible' | 'secret' | 'info' | 'error'
    auth_message: string
}

export class Greetd extends Service {
    static { Service.register(this); }

    private _decoder = new TextDecoder;

    readonly login = async (
        username: string,
        password: string,
        cmd: string[] | string,
        env: string[] = [],
    ) => {
        const session = await this.createSession(username);
        if (session.type !== 'auth_message') {
            this.cancelSession();
            throw session;
        }

        const auth = await this.postAuth(password);
        if (auth.type !== 'success') {
            this.cancelSession();
            throw auth;
        }

        const start = await this.startSession(cmd, env);
        if (start.type !== 'success') {
            this.cancelSession();
            throw start;
        }

        App.quit();
    };

    readonly createSession = (username: string) => {
        return this._send('create_session', { username });
    };

    readonly postAuth = (response?: string) => {
        return this._send('post_auth_message_response', { response });
    };

    readonly startSession = (cmd: string[] | string, env: string[] = []) => {
        const cmdv = Array.isArray(cmd)
            ? cmd
            : GLib.shell_parse_argv(cmd)[1];

        return this._send('start_session', { cmd: cmdv, env });
    };

    readonly cancelSession = () => {
        return this._send('cancel_session', {});
    };

    private async _send<R extends keyof Request>(req: R, payload: Request[R]): Promise<Response> {
        const connection = new Gio.SocketClient()
            .connect(new Gio.UnixSocketAddress({ path: SOCK }), null);

        try {
            const json = JSON.stringify({ type: req, ...payload });
            const ostream = new Gio.DataOutputStream({
                close_base_stream: true,
                base_stream: connection.get_output_stream(),
                byte_order: Gio.DataStreamByteOrder.HOST_ENDIAN,
            });

            const istream = connection.get_input_stream();

            ostream.put_int32(json.length, null);
            ostream.put_string(json, null);

            const data = await istream.read_bytes_async(4, GLib.PRIORITY_DEFAULT, null);
            const length = new Uint32Array(data.get_data()?.buffer || [0])[0];
            const res = await istream.read_bytes_async(length, GLib.PRIORITY_DEFAULT, null);
            return JSON.parse(this._decoder.decode(res.get_data()!)) as Response;
        } finally {
            connection.close(null);
        }
    }
}

export const greetd = new Greetd;
export default greetd;
