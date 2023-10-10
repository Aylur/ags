import Service from './service.js';
import GObject from 'gi://GObject';
import Gvc from 'gi://Gvc';
import App from '../app.js';
import { bulkConnect, bulkDisconnect } from '../utils.js';

const _MIXER_CONTROL_STATE = {
    [Gvc.MixerControlState.CLOSED]: 'closed',
    [Gvc.MixerControlState.READY]: 'ready',
    [Gvc.MixerControlState.CONNECTING]: 'connecting',
    [Gvc.MixerControlState.FAILED]: 'failed',
};

class Stream extends Service {
    static {
        Service.register(this, {
            'closed': [],
        }, {
            'description': ['string'],
            'is-muted': ['boolean'],
            'volume': ['float', 'rw'],
            'icon-name': ['string'],
            'id': ['int'],
            'state': ['string'],
        });
    }

    private _stream: Gvc.MixerStream;
    private _ids: number[];
    private _oldVolume = 0;

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
        ].map(prop => stream.connect(`notify::${prop}`, () => {
            this.changed(prop);
        }));
    }

    get stream() { return this._stream; }
    get description() { return this._stream.description; }
    get icon_name() { return this._stream.icon_name; }
    get id() { return this._stream.id; }
    get name() { return this._stream.name; }
    get state() { return _MIXER_CONTROL_STATE[this._stream.state]; }

    get is_muted() { return this.volume === 0; }
    set is_muted(mute: boolean) {
        if (mute) {
            this._oldVolume = this.volume;
            this.volume = 0;
        }
        else if (this.volume === 0) {
            this.volume = this._oldVolume || 0.25;
        }
    }

    get volume() {
        const max = Audio.instance.control.get_vol_max_norm();
        return this._stream.volume / max;
    }

    set volume(value) { // 0..100
        if (value > (App.config.maxStreamVolume))
            value = (App.config.maxStreamVolume);

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
            'speaker-changed': [],
            'microphone-changed': [],
            'stream-added': ['int'],
            'stream-removed': ['int'],
        }, {
            'apps': ['jsobject', 'rw'],
            'speakers': ['jsobject', 'rw'],
            'microphones': ['jsobject', 'rw'],
            'speaker': ['jsobject', 'rw'],
            'microphone': ['jsobject', 'rw'],
        });
    }

    private _control: Gvc.MixerControl;
    private _streams: Map<number, Stream>;
    private _streamBindings: Map<number, number>;
    private _speaker!: Stream;
    private _microphone!: Stream;
    private _speakerBinding!: number;
    private _microphoneBinding!: number;

    constructor() {
        super();

        this._control = new Gvc.MixerControl({
            name: `${pkg.name} mixer control`,
        });

        this._streams = new Map();
        this._streamBindings = new Map();

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
        this._control.set_default_sink(stream.stream);
    }

    get microphone() { return this._microphone; }
    set microphone(stream: Stream) {
        this._control.set_default_source(stream.stream);
    }

    get microphones() { return this._getStreams(Gvc.MixerSource); }
    get speakers() { return this._getStreams(Gvc.MixerSink); }
    get apps() { return this._getStreams(Gvc.MixerSinkInput); }

    getStream(id: number) {
        return this._streams.get(id);
    }

    private _defaultChanged(id: number, type: 'speaker' | 'microphone') {
        if (this[`_${type}`])
            this[`_${type}`].disconnect(this[`_${type}Binding`]);

        const stream = this._streams.get(id);
        if (!stream)
            return;

        this[`_${type}Binding`] = stream.connect('changed', () => this.emit(`${type}-changed`));
        this[`_${type}`] = stream;
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

        if (gvcstream instanceof Gvc.MixerSource)
            this.notify('microphones');

        if (gvcstream instanceof Gvc.MixerSink)
            this.notify('speakers');

        if (gvcstream instanceof Gvc.MixerSinkInput)
            this.notify('apps');

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

        if (stream.stream instanceof Gvc.MixerSource)
            this.notify('microphones');

        if (stream.stream instanceof Gvc.MixerSink)
            this.notify('speakers');

        if (stream.stream instanceof Gvc.MixerSinkInput)
            this.notify('apps');

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
}

export default class Audio {
    static _instance: AudioService;

    static get instance() {
        Service.ensureInstance(Audio, AudioService);
        return Audio._instance;
    }

    static getStream(id: number) { return Audio.instance.getStream(id); }

    static get microphones() { return Audio.instance.microphones; }
    static get speakers() { return Audio.instance.speakers; }
    static get apps() { return Audio.instance.apps; }

    static get microphone() { return Audio.instance.microphone; }
    static set microphone(stream: Stream) { Audio.instance.microphone = stream; }

    static get speaker() { return Audio.instance.speaker; }
    static set speaker(stream: Stream) { Audio.instance.speaker = stream; }
}
