/* eslint-disable max-len */
import AgsWidget, { type BaseProps } from './widgets/widget.js';
import AgsBox, { type BoxProps } from './widgets/box.js';
import AgsCenterBox, { type CenterBoxProps } from './widgets/centerbox.js';
import AgsEventBox, { type EventBoxProps } from './widgets/eventbox.js';
import AgsIcon, { type IconProps } from './widgets/icon.js';
import AgsLabel, { type LabelProps } from './widgets/label.js';
import AgsButton, { type ButtonProps } from './widgets/button.js';
import AgsSlider, { type SliderProps } from './widgets/slider.js';
import AgsScrollable, { type ScrollableProps } from './widgets/scrollable.js';
import AgsStack, { type StackProps } from './widgets/stack.js';
import AgsOverlay, { type OverlayProps } from './widgets/overlay.js';
import AgsRevealer, { type RevealerProps } from './widgets/revealer.js';
import AgsProgressBar, { type ProgressBarProps } from './widgets/progressbar.js';
import AgsEntry, { type EntryProps } from './widgets/entry.js';
import { AgsMenu, AgsMenuItem, type MenuProps, type MenuItemProps } from './widgets/menu.js';
import AgsWindow, { type WindowProps } from './widgets/window.js';
import AgsCircularProgress, { type CircularProgressProps } from './widgets/circularprogress.js';

export function mkCtor<Props>(w: new (...args: Props[]) => any, name?: string) {
    const Ctor = AgsWidget(w, name);
    return (props: Props & BaseProps<Props>) => new Ctor(props);
}

export const Box = mkCtor<BoxProps>(AgsBox, 'AgsBox');
export const Button = mkCtor<ButtonProps>(AgsButton, 'AgsButton');
export const CenterBox = mkCtor<CenterBoxProps>(AgsCenterBox, 'AgsCenterBox');
export const CircularProgress = mkCtor<CircularProgressProps>(AgsCircularProgress, 'AgsCircularProgress');
export const Entry = mkCtor<EntryProps>(AgsEntry, 'AgsEntry');
export const EventBox = mkCtor<EventBoxProps>(AgsEventBox, 'AgsEventBox');
export const Icon = mkCtor<IconProps>(AgsIcon, 'AgsIcon');
export const Label = mkCtor<LabelProps>(AgsLabel, 'AgsLabel');
export const Menu = mkCtor<MenuProps>(AgsMenu, 'AgsMenu');
export const MenuItem = mkCtor<MenuItemProps>(AgsMenuItem, 'AgsMenuItem');
export const Overlay = mkCtor<OverlayProps>(AgsOverlay, 'AgsOverlay');
export const ProgressBar = mkCtor<ProgressBarProps>(AgsProgressBar, 'AgsProgressBar');
export const Revealer = mkCtor<RevealerProps>(AgsRevealer, 'AgsRevealer');
export const Scrollable = mkCtor<ScrollableProps>(AgsScrollable, 'AgsScrollable');
export const Slider = mkCtor<SliderProps>(AgsSlider, 'AgsSlider');
export const Stack = mkCtor<StackProps>(AgsStack, 'AgsStack');
export const Window = mkCtor<WindowProps>(AgsWindow, 'AgsWindow');

const ctors = new Map();

// TODO: figure out how to type this
export function Widget<Props>({ type, ...props }: {
    type: new (props: Props) => any,
}) {
    let Ctor;
    if (ctors.has(type)) {
        Ctor = ctors.get(type);
    } else {
        Ctor = mkCtor<Props>(type);
        ctors.set(type, Ctor);
    }

    return Ctor(props);
}

// so they are still accessible when importing only Widget
Widget.Box = Box;
Widget.Button = Button;
Widget.CenterBox = CenterBox;
Widget.CircularProgress = CircularProgress;
Widget.Entry = Entry;
Widget.EventBox = EventBox;
Widget.Icon = Icon;
Widget.Label = Label;
Widget.Menu = Menu;
Widget.MenuItem = MenuItem;
Widget.Overlay = Overlay;
Widget.ProgressBar = ProgressBar;
Widget.Revealer = Revealer;
Widget.Scrollable = Scrollable;
Widget.Slider = Slider;
Widget.Stack = Stack;
Widget.Window = Window;

export default Widget;
