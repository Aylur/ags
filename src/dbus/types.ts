/* eslint-disable @typescript-eslint/no-misused-new */
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export interface DBusProxy extends Gio.DBusProxy {
    new(...args: unknown[]): DBusProxy
    ListNamesAsync: () => Promise<string[][]>
}

export interface PlayerProxy extends Gio.DBusProxy {
    new(...args: unknown[]): PlayerProxy;
    CanControl: boolean;
    CanGoNext: boolean;
    CanGoPrevious: boolean;
    CanPlay: boolean;
    CanPause: boolean;
    Metadata: { [key: string]: GLib.Variant };
    PlaybackStatus: string;
    Shuffle: boolean | null;
    LoopStatus: string | null;
    Volume: number;
    Position: number;
    SetPositionAsync: (trackid: string, position: number) => void;
    PlayPauseAsync: () => Promise<void>;
    NextAsync: () => Promise<void>;
    PreviousAsync: () => Promise<void>;
    StopAsync: () => Promise<void>;
    PlayAsync: () => Promise<void>;
}

export interface MprisProxy extends Gio.DBusProxy {
    new(...args: unknown[]): MprisProxy;
    Raise: () => void;
    Quit: () => void;
    CanQuit: boolean;
    CanRaise: boolean;
    Identity: string;
    DesktopEntry: string;
}

export interface BatteryProxy extends Gio.DBusProxy {
    new(...args: unknown[]): BatteryProxy;
    State: number;
    Percentage: number;
    IsPresent: boolean;
    TimeToEmpty: number;
    TimeToFull: number;
    Energy: number;
    EnergyFull: number;
    EnergyRate: number;
}

export interface StatusNotifierItemProxy extends Gio.DBusProxy {
    new(...args: unknown[]): StatusNotifierItemProxy;
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

export interface AgsProxy extends Gio.DBusProxy {
    new(...args: unknown[]): AgsProxy;
    InspectorRemote: () => void;
    QuitRemote: () => void;
    ToggleWindowSync: (name: string) => boolean;
    RunFileRemote: (
        js: string,
        busName?: string,
        objPath?: string,
    ) => void;
    RunJsRemote: (
        js: string,
        busName?: string,
        objPath?: string,
    ) => void;

    // FIXME: deprecated
    RunPromiseRemote: (
        js: string,
        busName?: string,
        objPath?: string,
    ) => void;
}

export interface StatusNotifierItemProxy extends Gio.DBusProxy {
    new(...args: unknown[]): StatusNotifierItemProxy;
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

export interface PowerProfilesProxy extends Gio.DBusProxy {
    new(...args: unknown[]): PowerProfilesProxy;
    ActiveProfile: string;
    PerformanceInhibited: string;
    PerformanceDegraded: string;
    Profiles: Array<{ [key: string]: GLib.Variant }>;
    Actions: string[];
    ActiveProfileHolds: Array<{ [key: string]: GLib.Variant }>;
    HoldProfile(profile: string, reason: string, application_id: string): number;
    ReleaseProfile(cookie: number): void;
}
