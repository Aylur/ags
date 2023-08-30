/* eslint-disable @typescript-eslint/no-misused-new */
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export interface DBusProxy extends Gio.DBusProxy {
    new(...args: unknown[]): DBusProxy
    ListNamesRemote: (callback: (names: string[][]) => void) => void
}

export interface PlayerProxy extends Gio.DBusProxy {
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

export interface MprisProxy extends Gio.DBusProxy {
    new(...args: unknown[]): MprisProxy
    Raise: () => void
    Quit: () => void
    CanQuit: boolean
    CanRaise: boolean
    Identity: string
    DesktopEntry: string
}

export interface BatteryProxy extends Gio.DBusProxy {
    new(...args: unknown[]): BatteryProxy
    State: number
    Percentage: number
    IsPresent: boolean
}

export interface AgsProxy extends Gio.DBusProxy {
    new(...args: unknown[]): AgsProxy
    InspectorRemote: () => void;
    QuitRemote: () => void;
    ToggleWindowSync: (name: string) => boolean;
    RunJsSync: (js: string) => string;
    RunPromiseRemote: (
        js: string,
        busName?: string,
        objPath?: string) => void
}
