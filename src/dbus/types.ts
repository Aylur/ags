/* eslint-disable @typescript-eslint/no-misused-new */
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Dbusmenu from 'gi://Dbusmenu';
import { AgsMenu } from 'src/widgets/menu.js';

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

export interface StatusNotifierItemProxy extends Gio.DBusProxy {
    new(...args: any[]): StatusNotifierItemProxy;
    Category: string;
    Id: string;
    Title: string;
    Status: string;
    WindowId: number;
    IconThemePath: string;
    ItemIsMenu: boolean;
    Menu: string;
    IconName: string;
    IconPixmap: [number, number, Uint8Array][];
    AttentionIconName: string;
    AttentionIconPixmap: [number, number, Uint8Array][];
    ToolTip: [string, [number, number, Uint8Array], string, string];
    ContextMenuAsync: (x: number, y: number) => Promise<void>;
    ActivateAsync: (x: number, y: number) => Promise<void>;
    SecondaryActivateAsync: (x: number, y: number) => Promise<void>;
    ScrollAsync: (delta: number, orientation: string) => Promise<void>;
}

