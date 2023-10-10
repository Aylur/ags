import "./gtk-types/gtk-3.0-ambient";
import "./gtk-types/gdk-3.0-ambient";
import "./gtk-types/cairo-1.0-ambient";
import "./gtk-types/gnomebluetooth-3.0-ambient";
import "./gtk-types/dbusmenugtk3-0.4-ambient";
import "./gtk-types/gobject-2.0-ambient";
import "./gtk-types/nm-1.0-ambient";
import "./gtk-types/soup-3.0-ambient";
import "./gtk-types/gvc-1.0-ambient";
interface Flags {
    busName: string;
    inspector: boolean;
    runJs: string;
    runPromise: string;
    toggleWindow: string;
    quit: boolean;
}
export default function (bus: string, path: string, flags: Flags): number | undefined;
export {};
