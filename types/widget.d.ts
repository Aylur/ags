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
import type Gtk from 'gi://Gtk';
export interface WidgetParams<T extends InstanceType<typeof Gtk.Widget>> extends CommonParams<T> {
    type: new (arg: Omit<WidgetParams<T>, keyof CommonParams<T> | "type">) => T;
}
declare function _Widget<Output extends InstanceType<typeof Gtk.Widget>, Params extends CommonParams<Output> | ConstructorParameters<Class>[0], Class extends new (arg: Omit<Params, keyof CommonParams<Output>>) => InstanceType<Class> & Output>({ type, ...params }: {
    type: Class;
} & Params): InstanceType<Class>;
export declare const Window: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | Omit<unknown, keyof CommonParams<Output>>) => AgsWindow & import("../types/gtk-types/gtk-3.0.js").Gtk.Widget;
export declare const Box: (args: {
    children?: import("../types/gtk-types/gtk-3.0.js").Gtk.Widget[] | null | undefined;
} | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsBox;
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
} | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsButton;
export declare const CenterBox: (args: {
    children?: import("../types/gtk-types/gtk-3.0.js").Gtk.Widget[] | null | undefined;
} | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsCenterBox;
export declare const CircularProgress: (args: import("../types/gtk-types/gtk-3.0.js").Gtk.Bin.ConstructorProperties | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsCircularProgress;
export declare const Entry: (args: {
    [key: string]: import("./widgets/constructor.js").Command;
} | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsEntry;
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
} | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsEventBox;
export declare const Icon: (args: string | object | import("../types/gtk-types/gdkpixbuf-2.0.js").GdkPixbuf.Pixbuf | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsIcon;
export declare const Label: (args: string | import("./widgets/label.js").Params | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsLabel;
export declare const Menu: (args: import("./widgets/menu.js").Params | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsMenu;
export declare const MenuItem: (args: {
    [key: string]: import("./widgets/constructor.js").Command;
} | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsMenuItem;
export declare const Overlay: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsOverlay;
export declare const ProgressBar: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsProgressBar;
export declare const Revealer: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsRevealer;
export declare const Scrollable: (args: object | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsScrollable;
export declare const Slider: (args: import("./widgets/slider.js").Params | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsSlider;
export declare const Stack: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsStack;
export declare const Widget: typeof _Widget & {
    Window: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | Omit<unknown, keyof CommonParams<Output>>) => AgsWindow & import("../types/gtk-types/gtk-3.0.js").Gtk.Widget;
    Box: (args: {
        children?: import("../types/gtk-types/gtk-3.0.js").Gtk.Widget[] | null | undefined;
    } | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsBox;
    Button: (args: {
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
    } | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsButton;
    CenterBox: (args: {
        children?: import("../types/gtk-types/gtk-3.0.js").Gtk.Widget[] | null | undefined;
    } | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsCenterBox;
    CircularProgress: (args: import("../types/gtk-types/gtk-3.0.js").Gtk.Bin.ConstructorProperties | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsCircularProgress;
    Entry: (args: {
        [key: string]: import("./widgets/constructor.js").Command;
    } | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsEntry;
    EventBox: (args: {
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
    } | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsEventBox;
    Icon: (args: string | object | import("../types/gtk-types/gdkpixbuf-2.0.js").GdkPixbuf.Pixbuf | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsIcon;
    Label: (args: string | import("./widgets/label.js").Params | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsLabel;
    Menu: (args: import("./widgets/menu.js").Params | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsMenu;
    MenuItem: (args: {
        [key: string]: import("./widgets/constructor.js").Command;
    } | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsMenuItem;
    Overlay: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsOverlay;
    ProgressBar: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsProgressBar;
    Revealer: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsRevealer;
    Scrollable: (args: object | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget>) => AgsScrollable;
    Slider: (args: import("./widgets/slider.js").Params | CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsSlider;
    Stack: (args: CommonParams<import("../types/gtk-types/gtk-3.0.js").Gtk.Widget> | undefined) => AgsStack;
};
export default Widget;
