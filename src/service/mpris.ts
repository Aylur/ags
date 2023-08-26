import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Service from './service.js';
import App from '../app.js';
import { loadInterfaceXML } from '../utils.js';
import { DBusProxy, PlayerProxy, MprisProxy } from '../dbus/types.js';
import Cache from './cache.js';

const DBusIFace = loadInterfaceXML('org.freedesktop.DBus');
const PlayerIFace = loadInterfaceXML('org.mpris.MediaPlayer2.Player');
const MprisIFace = loadInterfaceXML('org.mpris.MediaPlayer2');
const DBusProxy = Gio.DBusProxy.makeProxyWrapper(DBusIFace) as DBusProxy;
const PlayerProxy = Gio.DBusProxy.makeProxyWrapper(PlayerIFace) as PlayerProxy;
const MprisProxy = Gio.DBusProxy.makeProxyWrapper(MprisIFace) as MprisProxy;

const CACHE_KEY = 'covers';

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

class MprisPlayer extends GObject.Object {
    static {
        GObject.registerClass({
            Signals: {
                'changed': {},
                'closed': {},
                'position': { param_types: [GObject.TYPE_INT] },
            },
        }, this);
    }

    busName: string;
    name: string;
    entry!: string;
    identity!: string;

    trackid!: string;
    trackArtists!: string[];
    trackTitle!: string;
    trackCoverUrl!: string;
    coverPath!: string;
    playBackStatus!: PlaybackStatus;
    canGoNext!: boolean;
    canGoPrev!: boolean;
    canPlay!: boolean;
    shuffleStatus!: boolean | null;
    loopStatus!: LoopStatus | null;
    length!: number;
    _binding: { mpris: number, player: number };
    _mprisProxy: MprisProxy;
    _playerProxy: PlayerProxy;

    constructor(busName: string) {
        super();

        this.busName = busName;
        this.name = busName.substring(23).split('.')[0];

        this._binding = { mpris: 0, player: 0 };
        this._mprisProxy = new MprisProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');
        this._playerProxy = new PlayerProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._onMprisProxyReady();
        this._onPlayerProxyReady();

        Cache.Connect('cache-changed', (name: string, path: string) => {
            if (name == CACHE_KEY) {
                this.emit('changed');
                this.coverPath = path;
            }
        });

        Cache.Connect('cache-repolulated', (name: string) => {
            if (name == CACHE_KEY)
                this._updateState.bind(this);
        });

        Cache.NewCache(CACHE_KEY, App.config?.mediaCacheSize || 100);
    }

    close() {
        this._mprisProxy?.disconnect(this._binding.mpris);
        this._playerProxy?.disconnect(this._binding.player);
        this.emit('closed');
    }

    _onMprisProxyReady() {
        this._binding.mpris = this._mprisProxy.connect(
            'notify::g-name-owner',
            () => {
                if (!this._mprisProxy.g_name_owner)
                    this.close();
            });

        this.identity = this._mprisProxy.Identity;
        this.entry = this._mprisProxy.DesktopEntry;
        if (!this._mprisProxy.g_name_owner)
            this.close();
    }

    _onPlayerProxyReady() {
        this._binding.player = this._playerProxy.connect(
            'g-properties-changed', () => this._updateState());

        this._updateState();
    }

    _updateState() {
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

        this.shuffleStatus = this._playerProxy.Shuffle;
        this.loopStatus = this._playerProxy.LoopStatus as LoopStatus;
        this.canGoNext = this._playerProxy.CanGoNext;
        this.canGoPrev = this._playerProxy.CanGoPrevious;
        this.canPlay = this._playerProxy.CanPlay;
        this.playBackStatus =
            this._playerProxy.PlaybackStatus as PlaybackStatus;

        this.trackid = metadata['mpris:trackid'];
        this.trackArtists = trackArtists;
        this.trackTitle = trackTitle;
        this.trackCoverUrl = trackCoverUrl;
        this.length = length;
        this._cacheCoverArt();
        this.emit('changed');
    }

    _cacheCoverArt() {
        if (!this.trackCoverUrl) {
            this.coverPath = '';
            return;
        }
        this.coverPath = Cache.GetPath(CACHE_KEY, this.trackCoverUrl);
        if (!this.coverPath)
            Cache.AddPath(CACHE_KEY, this.trackCoverUrl);
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
            this.busName,
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
class MprisService extends Service {
    static {
        Service.register(this, {
            'player-changed': ['string'],
            'player-closed': ['string'],
            'player-added': ['string'],
        });
    }

    _players!: Players;
    _proxy: DBusProxy;

    constructor() {
        super();

        this._players = new Map();
        this._proxy = new DBusProxy(Gio.DBus.session,
            'org.freedesktop.DBus',
            '/org/freedesktop/DBus');

        this._onProxyReady();
    }

    _addPlayer(busName: string) {
        if (this._players.get(busName))
            return;

        const player = new MprisPlayer(busName);

        player.connect('closed', () => {
            this._players.delete(busName);
            this.emit('player-closed', busName);
            this.emit('changed');
        });

        player.connect('changed', () => {
            this.emit('player-changed', busName);
            this.emit('changed');
        });

        this._players.set(busName, player);
        this.emit('player-added', busName);
    }

    _onProxyReady() {
        this._proxy.ListNamesRemote(([names]) => {
            names?.forEach(name => {
                if (!name.startsWith('org.mpris.MediaPlayer2.'))
                    return;

                this._addPlayer(name);
            });
        });
        this._proxy.connectSignal('NameOwnerChanged',
            this._onNameOwnerChanged.bind(this));
    }

    _onNameOwnerChanged(
        _proxy: string,
        _sender: string,
        [name, oldOwner, newOwner]: string[],
    ) {
        if (!name.startsWith('org.mpris.MediaPlayer2.'))
            return;

        if (newOwner && !oldOwner)
            this._addPlayer(name);
    }

    getPlayer(name: string | ((players: Players) => MprisPlayer) = '') {
        if (typeof name === 'function')
            // @ts-ignore
            return name(new Map(this._players)) || null;

        for (const [busName, player] of this._players) {
            if (busName.includes(name))
                return player;
        }
        return null;
    }
}

export default class Mpris {
    static { Service.export(this, 'Mpris'); }
    static _instance: MprisService;

    static get instance() {
        Service.ensureInstance(Mpris, MprisService);
        return Mpris._instance;
    }

    static getPlayer(name: string | ((players: Players) => MprisPlayer)) {
        return Mpris._instance.getPlayer(name);
    }
}
