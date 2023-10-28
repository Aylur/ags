import Gtk from 'gi://Gtk?version=3.0';
import AgsWidget from './widgets/widget.js';
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

// @ts-expect-error margin override
export const Window = AgsWidget(AgsWindow);
export const Box = AgsWidget(AgsBox);
export const Button = AgsWidget(AgsButton);
export const CenterBox = AgsWidget(AgsCenterBox);
export const CircularProgress = AgsWidget(AgsCircularProgress);
export const Entry = AgsWidget(AgsEntry);
export const EventBox = AgsWidget(AgsEventBox);
export const Icon = AgsWidget(AgsIcon);
export const Label = AgsWidget(AgsLabel);
export const Menu = AgsWidget(AgsMenu);
export const MenuItem = AgsWidget(AgsMenuItem);
export const Overlay = AgsWidget(AgsOverlay);
export const ProgressBar = AgsWidget(AgsProgressBar);
export const Revealer = AgsWidget(AgsRevealer);
export const Scrollable = AgsWidget(AgsScrollable);
export const Slider = AgsWidget(AgsSlider);
export const Stack = AgsWidget(AgsStack);

const ctors = new Map();
export function Widget<
    T extends typeof Gtk.Widget,
    Props = ConstructorParameters<T>[0],
>({ type, ...props }:
    { type: T } & Props,
) {
    if (ctors.has(type))
        return ctors.get(type)(props);

    const ctor = AgsWidget(type);
    ctors.set(type, ctor);
    return ctor(props);
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
