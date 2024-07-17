import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Service from '../service.js';
import { ensureDirectory, idle } from '../utils.js';
import { CACHE_DIR } from '../utils.js';
import { loadInterfaceXML } from '../utils.js';
import { DBusProxy, PlayerProxy, MprisProxy } from '../dbus/types.js';

const DBusIFace = loadInterfaceXML('org.freedesktop.DBus')!;
const PlayerIFace = loadInterfaceXML('org.mpris.MediaPlayer2.Player')!;
const MprisIFace = loadInterfaceXML('org.mpris.MediaPlayer2')!;
const DBusProxy = Gio.DBusProxy.makeProxyWrapper(DBusIFace) as unknown as DBusProxy;
const PlayerProxy = Gio.DBusProxy.makeProxyWrapper(PlayerIFace) as unknown as PlayerProxy;
const MprisProxy = Gio.DBusProxy.makeProxyWrapper(MprisIFace) as unknown as MprisProxy;

const DBUS_PREFIX = 'org.mpris.MediaPlayer2.';
const MEDIA_CACHE_PATH = `${CACHE_DIR}/media`;

type PlaybackStatus = 'Playing' | 'Paused' | 'Stopped';
type LoopStatus = 'None' | 'Track' | 'Playlist';
type MprisMetadata = {
    'mpris:trackid'?: string
    'mpris:length'?: number
    'mpris:artUrl'?: string
    'xesam:album'?: string
    'xesam:albumArtist'?: string
    'xesam:artist'?: string[]
    'xesam:asText'?: string
    'xesam:audioBPM'?: number
    'xesam:autoRating'?: number
    'xesam:comment'?: string[]
    'xesam:composer'?: string[]
    'xesam:contentCreated'?: string
    'xesam:discNumber'?: number
    'xesam:firstUsed'?: string
    'xesam:genre'?: string[]
    'xesam:lastUsed'?: string
    'xesam:lyricist'?: string[]
    'xesam:title'?: string
    'xesam:trackNumber'?: number
    'xesam:url'?: string
    'xesam:useCount'?: number
    'xesam:userRating'?: number
    [key: string]: unknown
}

export class MprisPlayer extends Service {
    static {
        Service.register(this, {
            'closed': [],
            'position': ['int'],
        }, {
            'bus-name': ['string'],
            'name': ['string'],
            'entry': ['string'],
            'identity': ['string'],
            'metadata': ['string'],
            'trackid': ['string'],
            'track-artists': ['jsobject'],
            'track-title': ['string'],
            'track-album': ['string'],
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
    get metadata() { return this._metadata; }

    get trackid() { return this._trackid; }
    get track_artists() { return this._trackArtists; }
    get track_title() { return this._trackTitle; }
    get track_album() { return this._trackAlbum; }
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
    private _metadata: MprisMetadata = {};

    private _trackid!: string;
    private _trackArtists!: string[];
    private _trackTitle!: string;
    private _trackAlbum!: string;
    private _trackCoverUrl!: string;
    private _coverPath!: string;
    private _playBackStatus!: PlaybackStatus;
    private _canGoNext!: boolean;
    private _canGoPrev!: boolean;
    private _canPlay!: boolean;
    private _shuffleStatus!: boolean | null;
    private _loopStatus!: LoopStatus | null;
    private _length!: number;

    private _binding = { mpris: [0, 0], player: 0 };
    private _mprisProxy: MprisProxy;
    private _playerProxy: PlayerProxy;

    constructor(busName: string) {
        super();

        this._busName = busName;
        this._name = busName.substring(23).split('.')[0];

        this._mprisProxy = new MprisProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._playerProxy = new PlayerProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._onPlayerProxyReady();
        this._onMprisProxyReady();
        this._updateState();
        idle(this._updateState.bind(this));
    }

    close() {
        this._mprisProxy?.disconnect(this._binding.mpris[0]);
        this._mprisProxy?.disconnect(this._binding.mpris[1]);
        this._playerProxy?.disconnect(this._binding.player);
        this.emit('closed');
    }

    private _onMprisProxyReady() {
        this._binding.mpris[0] = this._mprisProxy.connect(
            'notify::g-name-owner',
            () => {
                if (!this._mprisProxy.g_name_owner)
                    this.close();
            });
        this._binding.mpris[1] = this._mprisProxy.connect(
            'g-properties-changed', () => this._updateState());

        this._identity = this._mprisProxy.Identity;
        this._entry = this._mprisProxy.DesktopEntry;
        if (!this._mprisProxy.g_name_owner)
            this.close();
    }

    private _onPlayerProxyReady() {
        this._binding.player = this._playerProxy.connect(
            'g-properties-changed', () => this._updateState());
    }

    private _updateState() {
        const metadata = {} as MprisMetadata;
        for (const prop in this._playerProxy.Metadata)
            metadata[prop] = this._playerProxy.Metadata[prop].deepUnpack();

        let trackArtists = metadata['xesam:artist'];
        if (!Array.isArray(trackArtists) ||
            !trackArtists.every(artist => typeof artist === 'string'))
            trackArtists = ['Unknown artist'];

        let trackTitle = metadata['xesam:title'];
        if (typeof trackTitle !== 'string')
            trackTitle = 'Unknown title';

        let trackAlbum = metadata['xesam:album'];
        if (typeof trackAlbum !== 'string')
            trackAlbum = 'Unknown album';

        let trackCoverUrl = metadata['mpris:artUrl'];
        if (typeof trackCoverUrl !== 'string')
            trackCoverUrl = '';

        let length = metadata['mpris:length'];
        length = typeof length === 'number' ? length / 1_000_000 : -1;

        this.updateProperty('metadata', metadata);
        this.updateProperty('shuffle-status', this._playerProxy.Shuffle);
        this.updateProperty('loop-status', this._playerProxy.LoopStatus);
        this.updateProperty('can-go-next', this._playerProxy.CanGoNext);
        this.updateProperty('can-go-prev', this._playerProxy.CanGoPrevious);
        this.updateProperty('can-play', this._playerProxy.CanPlay);
        this.updateProperty('play-back-status', this._playerProxy.PlaybackStatus);
        this.updateProperty('trackid', metadata['mpris:trackid']);
        this.updateProperty('track-artists', trackArtists);
        this.updateProperty('track-title', trackTitle);
        this.updateProperty('track-album', trackAlbum);
        this.updateProperty('track-cover-url', trackCoverUrl);
        this.updateProperty('length', length);
        this.updateProperty('identity', this._mprisProxy.Identity);
        this.updateProperty('entry', this._mprisProxy.DesktopEntry);
        this._cacheCoverArt();
        this.emit('changed');
    }

    private _cacheCoverArt() {
        if (!mpris.cacheCoverArt || this._trackCoverUrl === '')
            return;

        this._coverPath = MEDIA_CACHE_PATH + '/' +
            GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, this._trackCoverUrl, -1);

        if (GLib.file_test(this._coverPath, GLib.FileTest.EXISTS))
            return this.changed('cover-path');

        ensureDirectory(MEDIA_CACHE_PATH);
        Gio.File.new_for_uri(this._trackCoverUrl).copy_async(
            Gio.File.new_for_path(this._coverPath),
            Gio.FileCopyFlags.OVERWRITE,
            GLib.PRIORITY_DEFAULT,
            null, null, (source: Gio.File, result: Gio.AsyncResult) => {
                try {
                    source.copy_finish(result);
                    this.changed('cover-path');
                }
                catch (err) {
                    logError(err);
                    console.error(`failed to cache ${this._coverPath},` +
                        ' do you have gvfs installed?');
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

    readonly playPause = () => this._playerProxy.PlayPauseAsync().catch(console.error);
    readonly play = () => this._playerProxy.PlayAsync().catch(console.error);
    readonly stop = () => this._playerProxy.StopAsync().catch(console.error);

    readonly next = () => this._playerProxy.NextAsync().catch(console.error);
    readonly previous = () => this._playerProxy.PreviousAsync().catch(console.error);

    readonly shuffle = () => this._playerProxy.Shuffle = !this._playerProxy.Shuffle;
    readonly loop = () => {
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
    };
}

export class Mpris extends Service {
    static {
        Service.register(this, {
            'player-changed': ['string'],
            'player-closed': ['string'],
            'player-added': ['string'],
        }, {
            'players': ['jsobject'],
        });
    }

    public cacheCoverArt = true;

    private _proxy: DBusProxy;
    private _players: Map<string, MprisPlayer> = new Map;

    get players() {
        return Array.from(this._players.values());
    }

    constructor() {
        super();

        this._proxy = new DBusProxy(Gio.DBus.session,
            'org.freedesktop.DBus',
            '/org/freedesktop/DBus',
            this._onProxyReady.bind(this),
            null, Gio.DBusProxyFlags.NONE);
    }

    private _addPlayer(busName: string) {
        if (this._players.has(busName))
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

    private async _onProxyReady(_: DBusProxy, error: GLib.Error) {
        if (error)
            return logError(error);

        const [names] = await this._proxy.ListNamesAsync();
        for (const name of names) {
            if (name.startsWith(DBUS_PREFIX))
                this._addPlayer(name);
        }

        this._proxy.connectSignal('NameOwnerChanged',
            this._onNameOwnerChanged.bind(this));
    }

    private _onNameOwnerChanged(
        _proxy: Gio.DBusProxy,
        _sender: string,
        [name, oldOwner, newOwner]: string[],
    ) {
        if (!name.startsWith(DBUS_PREFIX))
            return;

        if (newOwner && !oldOwner)
            this._addPlayer(name);
    }

    readonly getPlayer = (name = '') => {
        for (const [busName, player] of this._players) {
            if (busName.includes(name))
                return player;
        }
        return null;
    };
}

export const mpris = new Mpris;
export default mpris;
