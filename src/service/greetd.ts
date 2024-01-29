import Service from '../service.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

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
    cancel_session: Record<string, never>
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
    static {
        Service.register(this);
    }

    create(username: string) {
        return this.send('create_session', { username });
    }

    auth(response?: string) {
        return this.send('post_auth_message_response', { response });
    }

    start(cmd: string[], env: string[] = []) {
        return this.send('start_session', { cmd, env });
    }

    cancel() {
        return this.send('cancel_session', {});
    }

    async send<R extends keyof Request>(req: R, payload: Request[R]): Promise<Response> {
        const connection = new Gio.SocketClient()
            .connect(new Gio.UnixSocketAddress({ path: SOCK }), null);

        try {
            const json = JSON.stringify({ type: req, ...payload });
            const ostream = new Gio.DataOutputStream({
                close_base_stream: true,
                base_stream: connection.get_output_stream(),
            });
            const istream = new Gio.DataInputStream({
                close_base_stream: true,
                base_stream: connection.get_input_stream(),
            });

            ostream.put_int32(json.length, null);
            ostream.put_string(json, null);

            // TODO: reading istream will block if sync
        } catch (err) {
            connection.close(null);
        }
    }
}

export const greetd = new Greetd;
export default greetd;
