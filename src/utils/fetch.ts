// code mostly take from https://github.com/sonnyp/troll

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

/*
 * this module gets loaded on startup, so in order
 * to make libsoup an optional dependency we do this
 */
let init = false;
async function libnotify() {
    try {
        import('gi://Soup?version=3.0');
    } catch (error) {
        console.error(Error('Missing dependency: libsoup3'));
        return null;
    }

    const Soup = (await import('gi://Soup?version=3.0')).default;

    if (init)
        return Soup;

    init = true;
    Gio._promisify(Soup.Session.prototype, 'send_async');
    Gio._promisify(Gio.MemoryOutputStream.prototype, 'splice_async');
    return Soup;
}

export type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
};

export class Response {
    status: number;
    statusText: string | null;
    ok: boolean;
    stream: Gio.InputStream | null;
    type = 'basic';

    constructor(
        status: number,
        statusText: string | null,
        ok: boolean,
        stream: Gio.InputStream | null,
    ) {
        this.status = status;
        this.statusText = statusText;
        this.ok = ok;
        this.stream = stream;
    }

    async json() {
        const text = await this.text();
        return JSON.parse(text);
    }

    async text() {
        const gBytes = await this.gBytes();
        return new TextDecoder().decode(gBytes ? gBytes.toArray() : []);
    }

    async arrayBuffer() {
        const gBytes = await this.gBytes();
        if (!gBytes)
            return null;

        return gBytes.toArray().buffer;
    }

    async gBytes() {
        const outputStream = Gio.MemoryOutputStream.new_resizable();
        if (!this.stream)
            return null;

        await outputStream.splice_async(this.stream,
            Gio.OutputStreamSpliceFlags.CLOSE_TARGET |
            Gio.OutputStreamSpliceFlags.CLOSE_SOURCE,
            GLib.PRIORITY_DEFAULT,
            null);

        return outputStream.steal_as_bytes();
    }
}

export async function fetch(url: string, options: FetchOptions = {}) {
    const Soup = await libnotify();
    if (!Soup) {
        console.error(Error('missing dependency: libsoup3'));
        return new Response(
            400,
            'can not fetch: missing dependency: libsoup3',
            false,
            null,
        );
    }

    const session = new Soup.Session();

    if (options.params) {
        url += '?' + Object.entries(options.params)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.map(val =>
                        `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
                } else if (typeof value === 'object') {
                    return `${encodeURIComponent(key)}=${encodeURIComponent(
                        JSON.stringify(value))}`;
                } else {
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                }
            })
            .join('&');
    }

    const message = new Soup.Message({
        method: options.method || 'GET',
        uri: GLib.Uri.parse(url, GLib.UriFlags.NONE),
    });

    if (options.headers) {
        for (const key of Object.keys(options.headers))
            message.get_request_headers().append(key, options.headers[key]);
    }

    if (typeof options.body === 'string') {
        message.set_request_body_from_bytes(null,
            new GLib.Bytes((new TextEncoder).encode(options.body)));
    }

    const inputStream = await session.send_async(message, 0, null);
    const { status_code, reason_phrase } = message;
    const ok = status_code >= 200 && status_code < 300;

    return new Response(status_code, reason_phrase, ok, inputStream);
}
