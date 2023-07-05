// @ts-nocheck
import Service from './service.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { bulkConnect, bulkDisconnect } from '../utils.js';

// I don't know yet how to import it without compiling
// import Gvc from '@girs/gvc-1.0';
const { Gvc } = imports.gi;

class Stream extends GObject.Object{
    static {
        GObject.registerClass({
            Signals: {
                'changed': {},
                'closed': {},
            },
        }, this);
    }

    _stream: Gvc.MixerStream;
    _ids: number[];

    constructor(stream: Gvc.MixerStream) {
        super();

        this._stream = stream;
        this._ids = bulkConnect(this._stream, [
            ['notify::description', () => this.emit('changed')],
            ['notify::is-muted',    () => this.emit('changed')],
            ['notify::volume',      () => this.emit('changed')],
            ['notify::icon-name',   () => this.emit('changed')],
            ['notify::id',          () => this.emit('changed')],
            ['notify::state',       () => this.emit('changed')],
        ]);
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
        this._stream.is_muted = muted;
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
    static { Service.register(this); }

    _control: Gvc.MixerControl;
    _streams: Map<number, Stream>;
    _speaker!: Stream;
    _mic!: Stream;

    constructor() {
        super();
        this._control = new Gvc.MixerControl({ name: `${pkg.name} mixer control` });
        this._streams = new Map();

        bulkConnect(this._control, [
            ['default-sink-changed', this._sinkChanged.bind(this)],
            ['default-source-changed', this._sourceChanged.bind(this)],
            ['stream-added', this._streamAdded.bind(this)],
            ['stream-removed', this._streamRemoved.bind(this)],
        ]);

        this._control.open();
    }

    _sinkChanged(_c: Gvc.MixerControl, id: number) {
        if (this._speaker)
            this._speaker.close();

        const stream = this._control.lookup_stream_id(id);
        if (!stream)
            return;

        this._speaker = new Stream(stream);
        this.emit('changed');
    }

    _sourceChanged(_c: Gvc.MixerControl, id: number) {
        if (this._mic)
            this._mic.close();

        const stream = this._control.lookup_stream_id(id);
        if (!stream)
            return;

        this._mic = new Stream(stream);
        this.emit('changed');
    }

    _streamAdded(_c: Gvc.MixerControl, id: number) {
        if (this._streams.has(id))
            return;

        const stream = this._control.lookup_stream_id(id);
        if (stream.is_event_stream || !(stream instanceof Gvc.MixerSinkInput))
            return;

        const streamWrapper = new Stream(stream);
        this._streams.set(id, streamWrapper);
        this.emit('changed');
    }

    _streamRemoved(_c: Gvc.MixerControl, id: number) {
        if (!this._streams.has(id))
            return;

        this._streams.get(id)?.close();
        this._streams.delete(id);
        this.emit('changed');
    }
}

export default class Audio {
    static { Service.export(this, 'Audio'); }
    static _instance: AudioService;

    static get instance() {
        Service.ensureInstance(Audio, AudioService);
        return Audio._instance;
    }

    static get speaker() {
        return Audio.instance._speaker;
    }

    static get microphone() {
        return Audio.instance._mic;
    }

    static get apps() {
        return Audio.instance._streams;
    }
}
