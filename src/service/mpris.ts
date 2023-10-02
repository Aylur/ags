import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from '../service.js';
import { ensureDirectory, timeout } from '../utils.js';
import { CACHE_DIR } from '../utils.js';
import { loadInterfaceXML } from '../utils.js';
import { DBusProxy, PlayerProxy, MprisProxy } from '../dbus/types.js';

const DBusIFace = loadInterfaceXML('org.freedesktop.DBus');
const PlayerIFace = loadInterfaceXML('org.mpris.MediaPlayer2.Player');
const MprisIFace = loadInterfaceXML('org.mpris.MediaPlayer2');
const DBusProxy = Gio.DBusProxy.makeProxyWrapper(DBusIFace) as DBusProxy;
const PlayerProxy = Gio.DBusProxy.makeProxyWrapper(PlayerIFace) as PlayerProxy;
const MprisProxy = Gio.DBusProxy.makeProxyWrapper(MprisIFace) as MprisProxy;

const MEDIA_CACHE_PATH = `${CACHE_DIR}/media`;

type PlaybackStatus = 'Playing' | 'Paused' | 'Stopped';
type LoopStatus = 'None' | 'Track' | 'Playlist';
type MprisMetadata = {
    'xesam:artist': string[]
    'xesam:title': string
    'mpris:artUrl': string
    'mpris:length': number
    'mpris:trackid': string
    [key: string]: unknown
}

class MprisPlayer extends Service {
    static {
        Service.register(this, {
            'closed': [],
            'position': ['int'],
        }, {
            'bus-name': ['string'],
            'name': ['string'],
            'entry': ['string'],
            'identity': ['string'],
            'trackid': ['string'],
            'track-artists': ['jsobject'],
            'track-title': ['string'],
            'track-cover-url': ['string'],
            'cover-path': ['string'],
            'play-back-status': ['string'],
            'can-go-next': ['boolean'],
            'can-go-prev': ['boolean'],
            'can-play': ['boolean'],
            'shuffle-status': ['jsobject'],
            'loop-status': ['jsobject'],
            'length': ['int'],
            'position': ['float', 'rw'],
            'volume': ['float', 'rw'],
        });
    }

    get bus_name() { return this._busName; }
    get name() { return this._name; }
    get entry() { return this._entry; }
    get identity() { return this._identity; }

    get trackid() { return this._trackid; }
    get track_artists() { return this._trackArtists; }
    get track_title() { return this._trackTitle; }
    get track_cover_url() { return this._trackCoverUrl; }
    get cover_path() { return this._coverPath; }
    get play_back_status() { return this._playBackStatus; }
    get can_go_next() { return this._canGoNext; }
    get can_go_prev() { return this._canGoPrev; }
    get can_play() { return this._canPlay; }
    get shuffle_status() { return this._shuffleStatus; }
    get loop_status() { return this._loopStatus; }
    get length() { return this._length; }

    private _busName: string;
    private _name: string;
    private _entry!: string;
    private _identity!: string;

    private _trackid!: string;
    private _trackArtists!: string[];
    private _trackTitle!: string;
    private _trackCoverUrl!: string;
    private _coverPath!: string;
    private _playBackStatus!: PlaybackStatus;
    private _canGoNext!: boolean;
    private _canGoPrev!: boolean;
    private _canPlay!: boolean;
    private _shuffleStatus!: boolean | null;
    private _loopStatus!: LoopStatus | null;
    private _length!: number;

    private _binding: { mpris: number, player: number };
    private _mprisProxy: MprisProxy;
    private _playerProxy: PlayerProxy;

    constructor(busName: string) {
        super();

        this._busName = busName;
        this._name = busName.substring(23).split('.')[0];

        this._binding = { mpris: 0, player: 0 };
        this._mprisProxy = new MprisProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._playerProxy = new PlayerProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._onMprisProxyReady();
        this._onPlayerProxyReady();

        timeout(100, this._updateState.bind(this));
    }

    close() {
        this._mprisProxy?.disconnect(this._binding.mpris);
        this._playerProxy?.disconnect(this._binding.player);
        this.emit('closed');
    }

    private _onMprisProxyReady() {
        this._binding.mpris = this._mprisProxy.connect(
            'notify::g-name-owner',
            () => {
                if (!this._mprisProxy.g_name_owner)
                    this.close();
            });

        this._identity = this._mprisProxy.Identity;
        this._entry = this._mprisProxy.DesktopEntry;
        if (!this._mprisProxy.g_name_owner)
            this.close();
    }

    private _onPlayerProxyReady() {
        this._binding.player = this._playerProxy.connect(
            'g-properties-changed', () => this._updateState());

        this._updateState();
    }

    private _updateState() {
        const metadata = {} as MprisMetadata;
        for (const prop in this._playerProxy.Metadata)
            metadata[prop] = this._playerProxy.Metadata[prop].deep_unpack();

        let trackArtists = metadata['xesam:artist'];
        if (!Array.isArray(trackArtists) ||
            !trackArtists.every(artist => typeof artist === 'string'))
            trackArtists = ['Unknown artist'];

        let trackTitle = metadata['xesam:title'];
        if (typeof trackTitle !== 'string')
            trackTitle = 'Unknown title';

        let trackCoverUrl = metadata['mpris:artUrl'];
        if (typeof trackCoverUrl !== 'string')
            trackCoverUrl = '';

        let length = metadata['mpris:length'];
        length = typeof length !== 'number'
            ? -1
            : Number.parseInt(`${length}`.substring(0, 3));

        this.updateProperty('shuffle-status', this._playerProxy.Shuffle);
        this.updateProperty('loop-status', this._playerProxy.LoopStatus);
        this.updateProperty('can-go-next', this._playerProxy.CanGoNext);
        this.updateProperty('can-go-prev', this._playerProxy.CanGoPrevious);
        this.updateProperty('can-play', this._playerProxy.CanPlay);
        this.updateProperty('play-back-status', this._playerProxy.PlaybackStatus);
        this.updateProperty('trackid', metadata['mpris:trackid']);
        this.updateProperty('track-artists', trackArtists);
        this.updateProperty('track-title', trackTitle);
        this.updateProperty('track-cover-url', trackCoverUrl);
        this.updateProperty('length', length);
        this._cacheCoverArt();
        this.emit('changed');
    }

    private _cacheCoverArt() {
        this._coverPath = MEDIA_CACHE_PATH + '/' +
            `${this._trackArtists.join(', ')}-${this._trackTitle}`
                .replace(/[\,\*\?\"\<\>\|\#\:\?\/\'\(\)]/g, '');

        if (this._coverPath.length > 255)
            this._coverPath = this._coverPath.substring(0, 255);

        if (this._trackCoverUrl === '' || this._coverPath === '')
            return;

        if (GLib.file_test(this._coverPath, GLib.FileTest.EXISTS))
            return;

        ensureDirectory(MEDIA_CACHE_PATH);
        Gio.File.new_for_uri(this._trackCoverUrl).copy_async(
            Gio.File.new_for_path(this._coverPath),
            Gio.FileCopyFlags.OVERWRITE,
            GLib.PRIORITY_DEFAULT,
            // @ts-expect-error
            null, null, (source, result) => {
                try {
                    source.copy_finish(result);
                    this.changed('cover-path');
                }
                catch (e) {
                    logError(e as Error, `failed to cache ${this._coverPath}`);
                }
            },
        );
    }

    get volume() {
        let volume = this._playerProxy.Volume;
        if (typeof volume !== 'number')
            volume = -1;

        return volume;
    }

    set volume(value) {
        this._playerProxy.Volume = value;
    }

    get position() {
        const proxy = Gio.DBusProxy.new_for_bus_sync(
            Gio.BusType.SESSION,
            Gio.DBusProxyFlags.NONE,
            null,
            this._busName,
            '/org/mpris/MediaPlayer2',
            'org.mpris.MediaPlayer2.Player',
            null,
        );

        const pos = proxy.get_cached_property('Position')?.unpack() as number;
        return pos ? pos / 1_000_000 : -1;
    }

    set position(time: number) {
        const micro = Math.floor(time * 1_000_000);
        this._playerProxy.SetPositionAsync(this.trackid, micro);
        this.notify('position');
        this.emit('position', time);
    }

    playPause() { this._playerProxy.PlayPauseAsync().catch(logError); }
    play() { this._playerProxy.PlayAsync().catch(logError); }
    stop() { this._playerProxy.StopAsync().catch(logError); }

    next() { this._playerProxy.NextAsync().catch(logError); }
    previous() { this._playerProxy.PreviousAsync().catch(logError); }

    shuffle() { this._playerProxy.Shuffle = !this._playerProxy.Shuffle; }
    loop() {
        switch (this._playerProxy.LoopStatus) {
            case 'None':
                this._playerProxy.LoopStatus = 'Track';
                break;
            case 'Track':
                this._playerProxy.LoopStatus = 'Playlist';
                break;
            case 'Playlist':
                this._playerProxy.LoopStatus = 'None';
                break;
            default:
                break;
        }
    }
}

type Players = Map<string, MprisPlayer>;
class Mpris extends Service {
    static {
        Service.register(this, {
            'player-changed': ['string'],
            'player-closed': ['string'],
            'player-added': ['string'],
        }, {
            'players': ['jsobject'],
        });
    }

    private _players!: Players;
    private _proxy: DBusProxy;

    get players() { return Array.from(this._players.values()); }

    constructor() {
        super();

        this._players = new Map();
        this._proxy = new DBusProxy(Gio.DBus.session,
            'org.freedesktop.DBus',
            '/org/freedesktop/DBus');

        this._onProxyReady();
    }

    private _addPlayer(busName: string) {
        if (this._players.get(busName))
            return;

        const player = new MprisPlayer(busName);

        player.connect('closed', () => {
            this._players.delete(busName);
            this.emit('player-closed', busName);
            this.changed('players');
        });

        player.connect('changed', () => {
            this.emit('player-changed', busName);
            this.emit('changed');
        });

        this._players.set(busName, player);
        this.emit('player-added', busName);
        this.changed('players');
    }

    private _onProxyReady() {
        this._proxy.ListNamesRemote(([names]) => {
            names.forEach(name => {
                if (!name.startsWith('org.mpris.MediaPlayer2.'))
                    return;

                this._addPlayer(name);
            });
        });
        this._proxy.connectSignal('NameOwnerChanged',
            this._onNameOwnerChanged.bind(this));
    }

    private _onNameOwnerChanged(
        _proxy: string,
        _sender: string,
        [name, oldOwner, newOwner]: string[],
    ) {
        if (!name.startsWith('org.mpris.MediaPlayer2.'))
            return;

        if (newOwner && !oldOwner)
            this._addPlayer(name);
    }

    getPlayer(name = '') {
        for (const [busName, player] of this._players) {
            if (busName.includes(name))
                return player;
        }
        return null;
    }
}

export default new Mpris();
