import "../gtk-types/gtk-3.0-ambient";
import "../gtk-types/gdk-3.0-ambient";
import "../gtk-types/cairo-1.0-ambient";
import "../gtk-types/gnomebluetooth-3.0-ambient";
import "../gtk-types/dbusmenugtk3-0.4-ambient";
import "../gtk-types/gobject-2.0-ambient";
import "../gtk-types/nm-1.0-ambient";
import "../gtk-types/soup-3.0-ambient";
import "../gtk-types/gvc-1.0-ambient";
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
type GioDBusProxy = InstanceType<typeof Gio.DBusProxy>;
export interface DBusProxy extends GioDBusProxy {
    new (...args: unknown[]): DBusProxy;
    ListNamesRemote: (callback: (names: string[][]) => void) => void;
}
export interface PlayerProxy extends GioDBusProxy {
    new (...args: unknown[]): PlayerProxy;
    CanControl: boolean;
    CanGoNext: boolean;
    CanGoPrevious: boolean;
    CanPlay: boolean;
    CanPause: boolean;
    Metadata: {
        [key: string]: InstanceType<typeof GLib.Variant>;
    };
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
export interface MprisProxy extends GioDBusProxy {
    new (...args: unknown[]): MprisProxy;
    Raise: () => void;
    Quit: () => void;
    CanQuit: boolean;
    CanRaise: boolean;
    Identity: string;
    DesktopEntry: string;
}
export interface BatteryProxy extends GioDBusProxy {
    new (...args: unknown[]): BatteryProxy;
    State: number;
    Percentage: number;
    IsPresent: boolean;
    TimeToEmpty: number;
    TimeToFull: number;
    Energy: number;
    EnergyFull: number;
    EnergyRate: number;
}
export interface StatusNotifierItemProxy extends GioDBusProxy {
    new (...args: unknown[]): StatusNotifierItemProxy;
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
export interface AgsProxy extends GioDBusProxy {
    new (...args: unknown[]): AgsProxy;
    InspectorRemote: () => void;
    QuitRemote: () => void;
    ToggleWindowSync: (name: string) => boolean;
    RunJsSync: (js: string) => string;
    RunPromiseRemote: (js: string, busName?: string, objPath?: string) => void;
}
export interface StatusNotifierItemProxy extends GioDBusProxy {
    new (...args: unknown[]): StatusNotifierItemProxy;
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
export {};
