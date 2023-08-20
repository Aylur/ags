import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Service from './service.js';
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
type cacheValue = {
    coverPath: string,
    timestamp: number,
};

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
    _coverCache: { [key: string]: cacheValue } = {};

    constructor(busName: string) {
        super();

        this._repopulateCoverCache();

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

        timeout(100, this._updateState.bind(this));
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
        if (this.trackCoverUrl === '') {
            this.coverPath = '';
            return;
        }

        const hash = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA256, this.trackCoverUrl, this.trackCoverUrl.length) + '';
        if (this._coverCache[hash]) {
            this.coverPath = this._coverCache[hash].coverPath;
            this._coverCache[hash].timestamp = Date.now();
            return;
        }

        this.coverPath = this._coverCacheAdd(hash, this.trackCoverUrl);
    }

    _repopulateCoverCache() {
        const cachePath = MEDIA_CACHE_PATH + '/covercache.json';
        ensureDirectory(MEDIA_CACHE_PATH);

        if (!GLib.file_test(cachePath, GLib.FileTest.EXISTS)) {
            this._coverCache = {};
            return;
        }

        const file = Gio.File.new_for_path(cachePath);
        const fileResult = file.load_contents(null);
        if (!fileResult[0]) {
            this._coverCache = {};
            return;
        }

        try {
            const cacheCovers = new TextDecoder().decode(fileResult[1]);
            this._coverCache = JSON.parse(cacheCovers);
            log(`loaded ${Object.keys(this._coverCache).length} covers from cover cache`);
        } catch (e) {
            logError(e as Error, `failed to parse ${cachePath}`);
            this._coverCache = {};
            return;
        }
    }

    _coverCacheAdd(hash: string, trackCoverUrl: string): string {
        const coverPath = MEDIA_CACHE_PATH + '/covers/' + hash;

        ensureDirectory(MEDIA_CACHE_PATH + '/covers/');

        Gio.File.new_for_uri(trackCoverUrl).copy_async(
            Gio.File.new_for_path(coverPath),
            Gio.FileCopyFlags.OVERWRITE,
            GLib.PRIORITY_DEFAULT,
            null,
            // @ts-ignore
            null,
            // @ts-ignore
            (source, result) => {
                try {
                    source.copy_finish(result);
                    this.emit('changed');
                }
                catch (e) {
                    logError(e as Error, `failed to cache ${trackCoverUrl}`);
                    return '';
                }
            },
        );

        this._coverCache[hash] = {
            coverPath,
            timestamp: Date.now(),
        };

        if (Object.keys(this._coverCache).length > 100)
            this._coverCachePurgeOldest();

        const cachePath = MEDIA_CACHE_PATH + '/covercache.json';
        const file = Gio.File.new_for_path(cachePath);
        const result = file.replace_contents(JSON.stringify(this._coverCache), null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        if (!result[0])
            logError(new Error(`failed to write ${cachePath}`));

        return coverPath;
    }

    _coverCachePurgeOldest() {
        let oldest = Infinity;
        let oldestKey = '';
        for (const key of Object.keys(this._coverCache)) {
            if (this._coverCache[key].timestamp < oldest) {
                oldest = this._coverCache[key].timestamp;
                oldestKey = key;
            }
        }
        delete (this._coverCache[oldestKey]);

        if (GLib.file_test(this._coverCache[oldestKey].coverPath, GLib.FileTest.EXISTS)) {
            const file = Gio.File.new_for_path(this._coverCache[oldestKey].coverPath);
            file.delete_async(GLib.PRIORITY_DEFAULT, null, null);
        }
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
            names.forEach(name => {
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
