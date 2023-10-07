import Service from './service.js';
import Gvc from 'gi://Gvc';
declare class Stream extends Service {
    private _stream;
    private _ids;
    private _oldVolume;
    constructor(stream: InstanceType<typeof Gvc.MixerStream>);
    get stream(): import("../../types/gtk-types/gvc-1.0.js").Gvc.MixerStream;
    get description(): string | null;
    get icon_name(): string | null;
    get id(): number;
    get name(): string | null;
    get state(): string;
    get is_muted(): boolean;
    set is_muted(mute: boolean);
    get volume(): number;
    set volume(value: number);
    close(): void;
}
declare class AudioService extends Service {
    private _control;
    private _streams;
    private _streamBindings;
    private _speaker;
    private _microphone;
    private _speakerBinding;
    private _microphoneBinding;
    constructor();
    get control(): import("../../types/gtk-types/gvc-1.0.js").Gvc.MixerControl;
    get speaker(): Stream;
    set speaker(stream: Stream);
    get microphone(): Stream;
    set microphone(stream: Stream);
    get microphones(): Stream[];
    get speakers(): Stream[];
    get apps(): Stream[];
    getStream(id: number): Stream | undefined;
    private _defaultChanged;
    private _streamAdded;
    private _streamRemoved;
    private _getStreams;
}
export default class Audio {
    static _instance: AudioService;
    static get instance(): AudioService;
    static getStream(id: number): Stream | undefined;
    static get microphones(): Stream[];
    static get speakers(): Stream[];
    static get apps(): Stream[];
    static get microphone(): Stream;
    static set microphone(stream: Stream);
    static get speaker(): Stream;
    static set speaker(stream: Stream);
}
export {};
