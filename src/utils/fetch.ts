// code mostly take from https://github.com/sonnyp/troll

import Soup from 'gi://Soup?version=3.0';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

Gio._promisify(Soup.Session.prototype, 'send_async');
Gio._promisify(Gio.MemoryOutputStream.prototype, 'splice_async');

export type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: string;
    headers?: Record<string, string>;
    params?: Record<string, string>;
};

export async function fetch(url: string, options: FetchOptions = {}) {
    const session = new Soup.Session();

    if (options.params) {
        url += '?' + Object.entries(options.params).map(([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
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

    return {
        status: status_code,
        statusText: reason_phrase,
        ok,
        type: 'basic',
        async json() {
            const text = await this.text();
            return JSON.parse(text);
        },
        async text() {
            const gBytes = await this.gBytes();
            return new TextDecoder().decode(gBytes.toArray());
        },
        async arrayBuffer() {
            const gBytes = await this.gBytes();
            return gBytes.toArray().buffer;
        },
        async gBytes() {
            const outputStream = Gio.MemoryOutputStream.new_resizable();

            await outputStream.splice_async(inputStream,
                Gio.OutputStreamSpliceFlags.CLOSE_TARGET |
                Gio.OutputStreamSpliceFlags.CLOSE_SOURCE,
                GLib.PRIORITY_DEFAULT,
                null);

            return outputStream.steal_as_bytes();
        },
    };
}
