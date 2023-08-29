/* eslint-disable @typescript-eslint/no-misused-new */
import GLib from 'gi://GLib';

interface Proxy {
    connect: (event: string, callback: () => void) => number
    disconnect: (id: number) => void
    g_name_owner: string
}

export interface DBusProxy extends Proxy {
    new(...args: unknown[]): DBusProxy
    ListNamesRemote: (callback: (names: string[][]) => void) => void
    connectSignal: (
        event: string,
        callback: (
            proxy: string,
            sender: string,
            owners: string[]
        ) => void) => void
}

export interface PlayerProxy extends Proxy {
    new(...args: unknown[]): PlayerProxy
    CanControl: boolean
    CanGoNext: boolean
    CanGoPrevious: boolean
    CanPlay: boolean
    CanPause: boolean
    Metadata: { [key: string]: GLib.Variant }
    PlaybackStatus: string
    Shuffle: boolean | null
    LoopStatus: string | null
    Volume: number
    Position: number
    SetPositionAsync: (trackid: string, position: number) => void
    PlayPauseAsync: () => Promise<void>
    NextAsync: () => Promise<void>
    PreviousAsync: () => Promise<void>
    StopAsync: () => Promise<void>
    PlayAsync: () => Promise<void>
}

export interface MprisProxy extends Proxy {
    new(...args: unknown[]): MprisProxy
    Raise: () => void
    Quit: () => void
    CanQuit: boolean
    CanRaise: boolean
    Identity: string
    DesktopEntry: string
}

export interface BatteryProxy extends Proxy {
    new(...args: unknown[]): BatteryProxy
    State: number
    Percentage: number
    IsPresent: boolean
}
