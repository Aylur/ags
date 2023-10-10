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
import AgsCircularProgress from './widgets/circularprogress.js';
import { CommonParams } from './widgets/constructor.js';
import type Gtk from 'types/gtk-types/gtk-3.0.js';
export interface WidgetParams<T extends Gtk.Widget> extends CommonParams {
    type: new (arg: Omit<WidgetParams<T>, keyof CommonParams | "type">) => T;
}
export default function Widget<Output extends InstanceType<typeof Gtk.Widget>, Params extends WidgetParams<Output>, Class extends new (arg: Omit<Params, keyof WidgetParams<Output>>) => Output>({ type, ...params }: {
    type: Class;
} & Params): InstanceType<Class>;
export declare const Window: (args: CommonParams & Omit<unknown, keyof CommonParams>) => Gtk.Widget;
export declare const Box: (args: CommonParams & {
    children?: Gtk.Widget[] | null | undefined;
}) => AgsBox;
export declare const Button: (args: CommonParams & {
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
}) => AgsButton;
export declare const CenterBox: (args: CommonParams & {
    children?: Gtk.Widget[] | null | undefined;
}) => AgsCenterBox;
export declare const CircularProgress: (args: CommonParams & Gtk.Bin.ConstructorProperties) => AgsCircularProgress;
export declare const Entry: (args: CommonParams & {
    [key: string]: import("./widgets/constructor.js").Command;
}) => AgsEntry;
export declare const EventBox: (args: CommonParams & {
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
}) => AgsEventBox;
export declare const Icon: (args: CommonParams & (string | object | import("../types/gtk-types/gdkpixbuf-2.0.js").GdkPixbuf.Pixbuf)) => AgsIcon;
export declare const Label: (args: CommonParams & (string | import("./widgets/label.js").Params)) => AgsLabel;
export declare const Menu: (args: CommonParams & import("./widgets/menu.js").Params) => AgsMenu;
export declare const MenuItem: (args: CommonParams & {
    [key: string]: import("./widgets/constructor.js").Command;
}) => AgsMenuItem;
export declare const Overlay: (args: never) => AgsOverlay;
export declare const ProgressBar: (args: never) => AgsProgressBar;
export declare const Revealer: (args: never) => AgsRevealer;
export declare const Scrollable: (args: CommonParams & object) => AgsScrollable;
export declare const Slider: (args: CommonParams & import("./widgets/slider.js").Params) => AgsSlider;
export declare const Stack: (args: never) => AgsStack;
