import Service from './service.js';
import GObject from 'gi://GObject';
import Gvc from 'gi://Gvc';
import { bulkConnect, bulkDisconnect } from '../utils.js';

class Stream extends Service {
    static {
        Service.register(this, {
            'closed': [],
        });
    }

    private _stream: Gvc.MixerStream;
    private _ids: number[];

    get stream() { return this._stream; }

    constructor(stream: Gvc.MixerStream) {
        super();

        this._stream = stream;
        this._ids = [
            'description',
            'is-muted',
            'volume',
            'icon-name',
            'id',
            'state',
        ].map(prop => stream.connect(
            `notify::${prop}`, () => this.emit('changed'),
        ));

        this.emit('changed');
    }

    get description() { return this._stream.description; }
    get iconName() { return this._stream.icon_name; }
    get id() { return this._stream.id; }
    get name() { return this._stream.name; }

    set isMuted(muted) { this._stream.set_is_muted(muted); }
    get isMuted() { return this._stream.is_muted; }

    get volume() {
        const max = Audio.instance.control.get_vol_max_norm();
        return this._stream.volume / max;
    }

    set volume(value) { // 0..100
        if (value > 1.5)
            value = 1.5;

        if (value < 0)
            value = 0;

        const max = Audio.instance.control.get_vol_max_norm();
        this._stream.set_volume(value * max);
        this._stream.push_volume();
    }

    close() {
        bulkDisconnect((this._stream as unknown) as GObject.Object, this._ids);
        this.emit('closed');
    }
}

class AudioService extends Service {
    static {
        Service.register(this, {
            'sink-changed': [],
            'source-changed': [],
            'stream-added': ['int'],
            'stream-removed': ['int'],
        });
    }

    private _control: Gvc.MixerControl;
    private _streams: Map<number, Stream>;
    private _sink!: Stream;
    private _source!: Stream;
    private _sinkBinding!: number;
    private _sourceBinding!: number;

    get sink() { return this._sink; }
    get source() { return this._source; }

    get control() { return this._control; }

    constructor() {
        super();
        this._control = new Gvc.MixerControl({
            name: `${pkg.name} mixer control`,
        });
        this._streams = new Map();

        bulkConnect((this._control as unknown) as GObject.Object, [
            ['default-sink-changed', (_c, id: number) => this._defaultChanged(id, 'sink')],
            ['default-source-changed', (_c, id: number) => this._defaultChanged(id, 'source')],
            ['stream-added', this._streamAdded.bind(this)],
            ['stream-removed', this._streamRemoved.bind(this)],
        ]);

        this._control.open();
    }

    private _defaultChanged(id: number, type: 'sink' | 'source') {
        if (this[`_${type}`])
            this[`_${type}`].disconnect(this[`_${type}Binding`]);

        const stream = this._streams.get(id);
        if (!stream)
            return;

        this[`_${type}Binding`] = stream.connect('changed',
            () => this.emit(`${type}-changed`));

        this[`_${type}`] = stream;
        this.emit(`${type}-changed`);
        this.emit('changed');
    }

    private _streamAdded(_c: Gvc.MixerControl, id: number) {
        if (this._streams.has(id))
            return;

        const stream = this._control.lookup_stream_id(id);

        this._streams.set(id, new Stream(stream));
        this.emit('changed');
        this.emit('stream-added', id);
    }

    private _streamRemoved(_c: Gvc.MixerControl, id: number) {
        if (!this._streams.has(id))
            return;

        this._streams.get(id)?.close();
        this._streams.delete(id);
        this.emit('changed');
        this.emit('stream-removed', id);
    }

    getStream(id: number) {
        return this._streams.get(id);
    }

    getStreams(filter: { new(): Gvc.MixerStream }) {
        const list = [];
        for (const [, stream] of this._streams) {
            if (stream.stream instanceof filter)
                list.push(stream);
        }
        return list;
    }

    setSink(stream: Stream) {
        this._control.set_default_sink(stream.stream);
    }

    setSource(stream: Stream) {
        this._control.set_default_source(stream.stream);
    }
}

export default class Audio {
    static _instance: AudioService;

    static get instance() {
        Service.ensureInstance(Audio, AudioService);
        return Audio._instance;
    }

    static getStream(id: number) { return Audio.instance.getStream(id); }

    static get sources() { return Audio.instance.getStreams(Gvc.MixerSource); }
    static get apps() { return Audio.instance.getStreams(Gvc.MixerSinkInput); }
    static get sinks() { return Audio.instance.getStreams(Gvc.MixerSink); }

    static get sink() { return Audio.instance.sink; }
    static set sink(stream: Stream) { Audio.instance.setSink(stream); }

    static get source() { return Audio.instance.source; }
    static set source(stream: Stream) { Audio.instance.setSource(stream); }
}
