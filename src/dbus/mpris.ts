import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const player = `<node>
    <interface name="org.mpris.MediaPlayer2.Player">
        <property name='CanControl' type='b' access='read' />
        <property name='CanGoNext' type='b' access='read' />
        <property name='CanGoPrevious' type='b' access='read' />
        <property name='CanPlay' type='b' access='read' />
        <property name='CanPause' type='b' access='read' />
        <property name='Metadata' type='a{sv}' access='read' />
        <property name='PlaybackStatus' type='s' access='read' />
        <property name='Shuffle' type='b' access='readwrite' />
        <property name='LoopStatus' type='s' access='readwrite' />
        <property name='Volume' type='d' access='readwrite' />
        <property name="Position" type="x" access="read"/>    
        <method name="SetPosition">
            <arg direction="in" type="o" name="TrackId"/>
            <arg direction="in" type="x" name="Position"/>
        </method>
        <method name='PlayPause' />
        <method name='Next' />
        <method name='Previous' />
        <method name='Stop' />
        <method name='Play' />
    </interface>
</node>`;

const mpris = `
<node>
    <interface name='org.mpris.MediaPlayer2'>
        <method name='Raise' />
        <method name='Quit' />
        <property name='CanQuit' type='b' access='read' />
        <property name='CanRaise' type='b' access='read' />
        <property name='Identity' type='s' access='read' />
        <property name='DesktopEntry' type='s' access='read' />
    </interface>
</node>`;

interface Proxy {
    connect: (event: string, callback: () => void) => number
    disconnect: (id: number) => void
    g_name_owner: string
}

export type MprisMetadata = {
    'xesam:artist': string[]
    'xesam:title': string
    'mpris:artUrl': string
    'mpris:length': number
    'mpris:trackid': string
    [key: string]: unknown
}

export interface TPlayerProxy extends Proxy {
    new (...args: any[]): TPlayerProxy
    CanControl: boolean
    CanGoNext: boolean
    CanGoPrevious: boolean
    CanPlay: boolean
    CanPause: boolean
    Metadata: { [key: string]: GLib.Variant }
    PlaybackStatus: string
    Shuffle?: boolean
    LoopStatus?: string
    Volume: number
    Position: number
    SetPositionAsync: (trackid: string, position: number) => void
    PlayPauseAsync: () => Promise<void>
    NextAsync: () => Promise<void>
    PreviousAsync: () => Promise<void>
    StopAsync: () => Promise<void>
    PlayAsync: () => Promise<void>
}

export interface TMprisProxy extends Proxy {
    new (...args: any[]): TMprisProxy
    Raise: () => void
    Quit: () => void
    CanQuit: boolean
    CanRaise: boolean
    Identity: string
    DesktopEntry: string
}

export const MprisPlayerProxy = Gio.DBusProxy.makeProxyWrapper(player) as TPlayerProxy;
export const MprisProxy = Gio.DBusProxy.makeProxyWrapper(mpris) as TMprisProxy;
