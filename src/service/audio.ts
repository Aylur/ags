import Service from '../service.js';
import GObject from 'gi://GObject';
import Gvc from 'gi://Gvc';
import { bulkConnect, bulkDisconnect } from '../utils.js';

const _MIXER_CONTROL_STATE = {
    [Gvc.MixerControlState.CLOSED]: 'closed',
    [Gvc.MixerControlState.READY]: 'ready',
    [Gvc.MixerControlState.CONNECTING]: 'connecting',
    [Gvc.MixerControlState.FAILED]: 'failed',
};

export class Stream extends Service {
    static {
        Service.register(this, {
            'closed': [],
        }, {
            'application-id': ['string'],
            'description': ['string'],
            'is-muted': ['boolean'],
            'volume': ['float', 'rw'],
            'icon-name': ['string'],
            'id': ['int'],
            'state': ['string'],
            'stream': ['jsobject'],
        });
    }

    private _stream?: Gvc.MixerStream;
    private _ids?: number[];
    private _oldVolume = 0;

    readonly setStream = (stream: Gvc.MixerStream | null) => {
        if (this._ids)
            bulkDisconnect((this._stream as unknown) as GObject.Object, this._ids);

        if (!stream)
            return;

        this._stream = stream;
        this._ids = [
            'application-id',
            'description',
            'is-muted',
            'volume',
            'icon-name',
            'id',
            'state',
        ].map(prop => {
            this.notify(prop);
            return stream.connect(`notify::${prop}`, () => {
                this.changed(prop);
            });
        });

        this.changed('stream');
    };

    constructor(stream?: Gvc.MixerStream) {
        super();
        this.setStream(stream || null);
    }

    get application_id() { return this._stream?.application_id ?? null; }
    get stream() { return this._stream ?? null; }
    get description() { return this._stream?.description ?? null; }
    get icon_name() { return this._stream?.icon_name ?? null; }
    get id() { return this._stream?.id ?? null; }
    get name() { return this._stream?.name ?? null; }
    get state() {
        return _MIXER_CONTROL_STATE[this._stream?.state || Gvc.MixerControlState.CLOSED];
    }

    get is_muted(): boolean | null {
        return this._stream?.is_muted ?? null;
    }

    set is_muted(mute: boolean) {
        if (this._stream) {
            this._stream.is_muted = mute;
            this._stream.change_is_muted(mute);
        }
    }

    get volume() {
        const max = audio.control.get_vol_max_norm();
        return this._stream ? this._stream.volume / max : 0;
    }

    set volume(value) { // 0..100
        if (value > (audio.maxStreamVolume))
            value = (audio.maxStreamVolume);

        if (value < 0)
            value = 0;

        const max = audio.control.get_vol_max_norm();
        this._stream?.set_volume(value * max);
        this._stream?.push_volume();
    }

    readonly close = () => {
        this.setStream(null);
        this.emit('closed');
    };
}

export class Audio extends Service {
    static {
        Service.register(this, {
            'speaker-changed': [],
            'microphone-changed': [],
            'stream-added': ['int'],
            'stream-removed': ['int'],
        }, {
            'apps': ['jsobject'],
            'recorders': ['jsobject'],
            'speakers': ['jsobject'],
            'microphones': ['jsobject'],
            'speaker': ['jsobject', 'rw'],
            'microphone': ['jsobject', 'rw'],
        });
    }

    public maxStreamVolume = 1.5;

    private _control: Gvc.MixerControl;
    private _streams: Map<number, Stream>;
    private _streamBindings: Map<number, number>;
    private _speaker!: Stream;
    private _microphone!: Stream;

    constructor() {
        super();

        this._control = new Gvc.MixerControl({
            name: `${pkg.name} mixer control`,
        });

        this._streams = new Map();
        this._streamBindings = new Map();
        for (const s of ['speaker', 'microphone'] as const) {
            this[`_${s}`] = new Stream();
            this[`_${s}`].connect('changed', () => {
                this.emit(`${s}-changed`);
                this.emit('changed');
            });
        }

        bulkConnect(this._control as unknown as GObject.Object, [
            ['default-sink-changed', (_c, id: number) => this._defaultChanged(id, 'speaker')],
            ['default-source-changed', (_c, id: number) => this._defaultChanged(id, 'microphone')],
            ['stream-added', this._streamAdded.bind(this)],
            ['stream-removed', this._streamRemoved.bind(this)],
        ]);

        this._control.open();
    }

    get control() { return this._control; }

    get speaker() { return this._speaker; }
    set speaker(stream: Stream) {
        this._control.set_default_sink(stream.stream!);
    }

    get microphone() { return this._microphone; }
    set microphone(stream: Stream) {
        this._control.set_default_source(stream.stream!);
    }

    get microphones() { return this._getStreams(Gvc.MixerSource); }
    get speakers() { return this._getStreams(Gvc.MixerSink); }
    get apps() { return this._getStreams(Gvc.MixerSinkInput); }
    get recorders() { return this._getStreams(Gvc.MixerSourceOutput); }

    readonly getStream = (id: number) => {
        return this._streams.get(id);
    };

    private _defaultChanged(id: number, type: 'speaker' | 'microphone') {
        const stream = this._streams.get(id);
        if (!stream)
            return;

        this[`_${type}`].setStream(stream.stream);
        this.changed(type);
        this.emit(`${type}-changed`);
    }

    private _streamAdded(_c: Gvc.MixerControl, id: number) {
        if (this._streams.has(id))
            return;

        const gvcstream = this._control.lookup_stream_id(id);
        const stream = new Stream(gvcstream);
        const binding = stream.connect('changed', () => this.emit('changed'));

        this._streams.set(id, stream);
        this._streamBindings.set(id, binding);

        this._notifyStreams(stream);
        this.emit('stream-added', id);
        this.emit('changed');
    }

    private _streamRemoved(_c: Gvc.MixerControl, id: number) {
        const stream = this._streams.get(id);
        if (!stream)
            return;

        stream.disconnect(this._streamBindings.get(id) as number);
        stream.close();

        this._streams.delete(id);
        this._streamBindings.delete(id);
        this.emit('stream-removed', id);

        this._notifyStreams(stream);
        this.emit('changed');
    }

    private _getStreams(filter: { new(): Gvc.MixerStream }) {
        const list = [];
        for (const [, stream] of this._streams) {
            if (stream.stream instanceof filter)
                list.push(stream);
        }
        return list;
    }

    private _notifyStreams(stream: Stream) {
        if (stream.stream instanceof Gvc.MixerSource)
            this.notify('microphones');

        if (stream.stream instanceof Gvc.MixerSink)
            this.notify('speakers');

        if (stream.stream instanceof Gvc.MixerSinkInput)
            this.notify('apps');

        if (stream.stream instanceof Gvc.MixerSourceOutput)
            this.notify('recorders');
    }
}

const audio = new Audio;
export default audio;
