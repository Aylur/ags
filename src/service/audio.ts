import Service from './service.js';
import GObject from 'gi://GObject';
import Gvc from 'gi://Gvc';
import { bulkConnect, bulkDisconnect } from '../utils.js';

class Stream extends GObject.Object{
    static {
        GObject.registerClass({
            Signals: { 'changed': {}, 'closed': {} },
        }, this);
    }

    _stream: Gvc.MixerStream;
    _ids: number[];

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
        ].map(prop => stream.connect(`notify::${prop}`, () => this.emit('changed')));
        this.emit('changed');
    }

    get description() { return this._stream.description; }
    get iconName() { return this._stream.icon_name; }
    get id() { return this._stream.id; }
    get name() { return this._stream.name; }

    get volume() {
        return this._stream.volume / Audio._instance._control.get_vol_max_norm();
    }

    set volume(value) { // 0..100
        if (value > 1.5)
            value = 1.5;

        if (value < 0)
            value = 0;

        this._stream.set_volume(value * Audio._instance._control.get_vol_max_norm());
        this._stream.push_volume();
    }

    set isMuted(muted) {
        this._stream.set_is_muted(muted);
    }

    get isMuted() {
        return this._stream.is_muted;
    }

    close() {
        bulkDisconnect((this._stream as unknown) as GObject.Object, this._ids);
        this.emit('closed');
    }
}

class AudioService extends Service{
    static {
        Service.register(this, {
            'speaker-changed': [],
            'microphone-changed': [],
        });
    }

    _control: Gvc.MixerControl;
    _streams: Map<number, Stream>;
    _speaker!: Stream;
    _microphone!: Stream;
    _speakerID!: number;
    _microphoneID!: number;

    constructor() {
        super();
        this._control = new Gvc.MixerControl({ name: `${pkg.name} mixer control` });
        this._streams = new Map();

        bulkConnect((this._control as unknown) as GObject.Object, [
            ['default-sink-changed', (_c, id: number) => this._defaultChanged(id, 'speaker')],
            ['default-source-changed', (_c, id: number) => this._defaultChanged(id, 'microphone')],
            ['stream-added', this._streamAdded.bind(this)],
            ['stream-removed', this._streamRemoved.bind(this)],
        ]);

        this._control.open();
    }

    _defaultChanged(id: number, type: 'speaker'|'microphone') {
        if (this[`_${type}`])
            this[`_${type}`].disconnect(this[`_${type}ID`]);

        const stream = this._streams.get(id);
        if (!stream)
            return;

        this[`_${type}ID`] = stream.connect('changed', () => this.emit(`${type}-changed`));
        this[`_${type}`] = stream;
        this.emit(`${type}-changed`);
        this.emit('changed');
    }

    _streamAdded(_c: Gvc.MixerControl, id: number) {
        if (this._streams.has(id))
            return;

        const stream = this._control.lookup_stream_id(id);

        this._streams.set(id, new Stream(stream));
        this.emit('changed');
    }

    _streamRemoved(_c: Gvc.MixerControl, id: number) {
        if (!this._streams.has(id))
            return;

        this._streams.get(id)?.close();
        this._streams.delete(id);
        this.emit('changed');
    }

    getStreams(filter: any) {
        const map = new Map();
        for (const [id, stream] of this._streams) {
            if (stream._stream instanceof filter)
                map.set(id, stream);
        }
        return map;
    }

    setSpeaker(stream: Stream) {
        this._control.set_default_sink(stream._stream);
    }

    setMicrophone(stream: Stream) {
        this._control.set_default_source(stream._stream);
    }
}

export default class Audio {
    static { Service.export(this, 'Audio'); }
    static _instance: AudioService;

    static get instance() {
        Service.ensureInstance(Audio, AudioService);
        return Audio._instance;
    }

    static get apps() { return Audio.instance.getStreams(Gvc.MixerSinkInput); }
    static get speakers() { return Audio.instance.getStreams(Gvc.MixerSink); }
    static get microphones() { return Audio.instance.getStreams(Gvc.MixerSource); }

    static get speaker() { return Audio.instance._speaker; }
    static set speaker(stream: Stream) { Audio.instance.setSpeaker(stream); }

    static get microphone() { return Audio.instance._microphone; }
    static set microphone(stream: Stream) { Audio.instance.setMicrophone(stream); }
}
