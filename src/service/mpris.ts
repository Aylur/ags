import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from './service.js';
import { ensureCache, timeout } from '../utils.js';
import { MprisPlayerProxy, MprisProxy, TMprisProxy, TPlayerProxy, MprisMetadata } from '../dbus/mpris.js';
import { DBusProxy, TDBusProxy } from '../dbus/dbus.js';
import { MEDIA_CACHE_PATH } from '../utils.js';

type PlaybackStatus = 'Playing'|'Paused'|'Stopped';
type LoopStatus = 'None'|'Track'|'Playlist';
type PlayerState = {
    trackid: string
    trackArtists: string[]
    trackTitle: string
    trackCoverUrl: string
    coverPath: string
    playBackStatus: PlaybackStatus
    canGoNext: boolean
    canGoPrev: boolean
    canPlay: boolean
    shuffle?: boolean
    loopStatus?: LoopStatus
    volume: number
    length: number
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

    _binding: { mpris: number, player: number };
    _busName: string;
    _name: string;
    _entry!: string;
    _identity!: string;
    _state!: PlayerState;
    _mprisProxy: TMprisProxy;
    _playerProxy: TPlayerProxy;

    constructor(busName: string) {
        super();

        this._binding = { mpris: -1, player: -1 };
        this._busName = busName;
        this._name = busName.substring(23).split('.')[0];

        this._mprisProxy = new MprisProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._playerProxy = new MprisPlayerProxy(
            Gio.DBus.session, busName,
            '/org/mpris/MediaPlayer2');

        this._onMprisProxyReady();
        this._onPlayerProxyReady();

        timeout(100, this._updateState.bind(this));
    }

    get entry() { return this._entry; }
    get identity() { return this._identity; }
    get name() { return this._name; }
    get state() { return this._state; }

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

        this._identity = this._mprisProxy.Identity;
        this._entry = this._mprisProxy.DesktopEntry;
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
            trackArtists =  ['Unknown artist'];

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

        const playBackStatus = this._playerProxy.PlaybackStatus as PlaybackStatus;
        const canGoNext = this._playerProxy.CanGoNext;
        const canGoPrev = this._playerProxy.CanGoPrevious;
        const canPlay = this._playerProxy.CanPlay;

        const shuffle = this._playerProxy.Shuffle;
        const loopStatus = this._playerProxy.LoopStatus as LoopStatus;

        let volume = this._playerProxy.Volume;
        if (typeof volume !== 'number')
            volume = -1;

        this._state = {
            trackid: metadata['mpris:trackid'],
            trackArtists,
            trackTitle,
            trackCoverUrl,
            coverPath: '',
            playBackStatus,
            canGoNext,
            canGoPrev,
            canPlay,
            shuffle,
            loopStatus,
            volume: volume >= 0 ? volume*100 : -1,
            length,
        };

        this._cacheCoverArt();
        this.emit('changed');
    }

    _cacheCoverArt(){
        this._state.coverPath = MEDIA_CACHE_PATH + '/' +
            `${this._state.trackArtists.join(', ')}_${this._state.trackTitle}`
            .replace(/[\,\*\?\"\<\>\|\#\:\?\/\'\(\)]/g, '');

        if (this._state.coverPath.length > 50)
            this._state.coverPath = this._state.coverPath.slice(0, 50);

        const { trackCoverUrl, coverPath } = this._state;
        if (trackCoverUrl === '' || coverPath === '')
            return;

        if (GLib.file_test(coverPath, GLib.FileTest.EXISTS))
            return;

        ensureCache();

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
                    logError(e as Error, `failed to cache ${coverPath}`);
                }
            },
        );
    }

    getPosition() {
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
        return pos ? pos/1_000_000 : -1;
    }

    setPosition(time: number) {
        const micro = Math.floor(time*1_000_000);
        this._playerProxy.SetPositionAsync(this._state.trackid, micro);
        this.emit('position', time);
    }

    setVolume(value: number){ this._playerProxy.Volume = value/100; }

    playPause() { this._playerProxy.PlayPauseAsync().catch(logError); }
    play() { this._playerProxy.PlayAsync().catch(logError); }
    stop() { this._playerProxy.StopAsync().catch(logError); }

    next() { this._playerProxy.NextAsync().catch(logError); }
    previous() { this._playerProxy.PreviousAsync().catch(logError); }

    shuffle(){ this._playerProxy.Shuffle = !this._playerProxy.Shuffle; }
    loop(){
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

class MprisService extends Service{
    static {
        Service.register(this, {
            'position': [
                GObject.TYPE_STRING,
                GObject.TYPE_INT,
                GObject.TYPE_INT,
            ],
        });
    }

    _players!: Players;
    _proxy: TDBusProxy;

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
            this.emit('changed');
        });

        player.connect('changed', () =>
            this.emit('changed'));

        this._players.set(busName, player);
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

    _onNameOwnerChanged(_proxy: string, _sender: string, [name, oldOwner, newOwner]: string[]) {
        if (!name.startsWith('org.mpris.MediaPlayer2.'))
            return;

        if (newOwner && !oldOwner)
            this._addPlayer(name);
    }

    getPlayer(name: string|((players: Players) => MprisPlayer) = '') {
        if (typeof name === 'function')
            // @ts-ignore
            return name(new Map(this._players));

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

    static connect(widget: Gtk.Widget, callback: () => void) {
        Service.ensureInstance(Mpris, MprisService);
        Mpris._instance.listen(widget, callback);
    }

    static getPlayer(name: string|((players: Players) => MprisPlayer)): MprisPlayer|null {
        Service.ensureInstance(Mpris, MprisService);
        return Mpris._instance.getPlayer(name);
    }
}
