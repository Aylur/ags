import "./gtk-types/gtk-3.0-ambient";
import "./gtk-types/gdk-3.0-ambient";
import "./gtk-types/cairo-1.0-ambient";
import "./gtk-types/gnomebluetooth-3.0-ambient";
import "./gtk-types/dbusmenugtk3-0.4-ambient";
import "./gtk-types/gobject-2.0-ambient";
import "./gtk-types/nm-1.0-ambient";
import "./gtk-types/soup-3.0-ambient";
import "./gtk-types/gvc-1.0-ambient";
import './widgets/overrides.js';
import AgsBox from './widgets/box.js';
import AgsCenterBox from './widgets/centerbox.js';
import AgsEventBox from './widgets/eventbox.js';
import AgsIcon from './widgets/icon.js';
import AgsLabel from './widgets/label.js';
import AgsButton from './widgets/button.js';
import AgsSlider from './widgets/slider.js';
import AgsScrollable from './widgets/scrollable.js';
import AgsStack from './widgets/stack.js';
import AgsOverlay from './widgets/overlay.js';
import AgsRevealer from './widgets/revealer.js';
import AgsProgressBar from './widgets/progressbar.js';
import AgsEntry from './widgets/entry.js';
import { AgsMenu, AgsMenuItem } from './widgets/menu.js';
import AgsWindow from './widgets/window.js';
import AgsCircularProgress from './widgets/circularprogress.js';
import { CommonParams } from './widgets/constructor.js';
import type Gtk from 'types/gtk-types/gtk-3.0.js';
export interface WidgetParams<T extends Gtk.Widget> extends CommonParams<T> {
    type: new (arg: Omit<WidgetParams<T>, keyof CommonParams<T> | "type">) => T;
}
export declare function Widget<Output extends InstanceType<typeof Gtk.Widget>, Params extends CommonParams<Output> | ConstructorParameters<Class>[0], Class extends new (arg: Omit<Params, keyof CommonParams<Output>>) => InstanceType<Class> & Output>({ type, ...params }: {
    type: Class;
} & Params): InstanceType<Class>;
export default Widget;
export declare const Window: (args: CommonParams<Gtk.Widget> | Omit<unknown, keyof CommonParams<Output>>) => AgsWindow & Gtk.Widget;
export declare const Box: (args: {
    children?: Gtk.Widget[] | null | undefined;
} | CommonParams<Gtk.Widget>) => AgsBox;
export declare const Button: (args: {
    onClicked?: string | undefined;
    onPrimaryClick?: string | undefined;
    onSecondaryClick?: string | undefined;
    onMiddleClick?: string | undefined;
    onPrimaryClickRelease?: string | undefined;
    onSecondaryClickRelease?: string | undefined;
    onMiddleClickRelease?: string | undefined;
    onHover?: string | undefined;
    onHoverLost?: string | undefined;
    onScrollUp?: string | undefined;
    onScrollDown?: string | undefined;
} | CommonParams<Gtk.Widget> | undefined) => AgsButton;
export declare const CenterBox: (args: {
    children?: Gtk.Widget[] | null | undefined;
} | CommonParams<Gtk.Widget>) => AgsCenterBox;
export declare const CircularProgress: (args: Gtk.Bin.ConstructorProperties | CommonParams<Gtk.Widget> | undefined) => AgsCircularProgress;
export declare const Entry: (args: {
    [key: string]: import("./widgets/constructor.js").Command;
} | CommonParams<Gtk.Widget>) => AgsEntry;
export declare const EventBox: (args: {
    onPrimaryClick?: string | undefined;
    onSecondaryClick?: string | undefined;
    onMiddleClick?: string | undefined;
    onPrimaryClickRelease?: string | undefined;
    onSecondaryClickRelease?: string | undefined;
    onMiddleClickRelease?: string | undefined;
    onHover?: string | undefined;
    onHoverLost?: string | undefined;
    onScrollUp?: string | undefined;
    onScrollDown?: string | undefined;
} | CommonParams<Gtk.Widget> | undefined) => AgsEventBox;
export declare const Icon: (args: string | object | import("../types/gtk-types/gdkpixbuf-2.0.js").GdkPixbuf.Pixbuf | CommonParams<Gtk.Widget>) => AgsIcon;
export declare const Label: (args: string | import("./widgets/label.js").Params | CommonParams<Gtk.Widget>) => AgsLabel;
export declare const Menu: (args: import("./widgets/menu.js").Params | CommonParams<Gtk.Widget> | undefined) => AgsMenu;
export declare const MenuItem: (args: {
    [key: string]: import("./widgets/constructor.js").Command;
} | CommonParams<Gtk.Widget>) => AgsMenuItem;
export declare const Overlay: (args: CommonParams<Gtk.Widget> | undefined) => AgsOverlay;
export declare const ProgressBar: (args: CommonParams<Gtk.Widget> | undefined) => AgsProgressBar;
export declare const Revealer: (args: CommonParams<Gtk.Widget> | undefined) => AgsRevealer;
export declare const Scrollable: (args: object | CommonParams<Gtk.Widget>) => AgsScrollable;
export declare const Slider: (args: import("./widgets/slider.js").Params | CommonParams<Gtk.Widget> | undefined) => AgsSlider;
export declare const Stack: (args: CommonParams<Gtk.Widget> | undefined) => AgsStack;
