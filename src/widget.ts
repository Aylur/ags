/* eslint-disable max-len */
import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject?version=2.0';
import AgsWidget, { type BaseProps } from './widgets/widget.js';
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

function createCtor<T extends typeof Gtk.Widget>(Widget: T) {
    return (...props: ConstructorParameters<T>) => new Widget(...props) as InstanceType<T>;
}

export const Window = createCtor(AgsWindow);
export const Box = createCtor(AgsBox);
export const Button = createCtor(AgsButton);
export const CenterBox = createCtor(AgsCenterBox);
export const CircularProgress = createCtor(AgsCircularProgress);
export const Entry = createCtor(AgsEntry);
export const EventBox = createCtor(AgsEventBox);
export const Icon = createCtor(AgsIcon);
export const Label = createCtor(AgsLabel);
export const Menu = createCtor(AgsMenu);
export const MenuItem = createCtor(AgsMenuItem);
export const Overlay = createCtor(AgsOverlay);
export const ProgressBar = createCtor(AgsProgressBar);
export const Revealer = createCtor(AgsRevealer);
export const Scrollable = createCtor(AgsScrollable);
export const Slider = createCtor(AgsSlider);
export const Stack = createCtor(AgsStack);

const ctors = new Map();
export function Widget<
    T extends typeof Gtk.Widget,
    Props = ConstructorParameters<T>[0],
>({ type, ...props }:
    { type: T } & Props,
) {
    if (ctors.has(type))
        return ctors.get(type)(props);

    const Ctor = AgsWidget(type);
    ctors.set(type, Ctor);
    return new Ctor(props);
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

export function subclass<T extends typeof Gtk.Widget, Props>(W: T) {
    class Widget extends AgsWidget(W, `Gtk${W.name}`) {
        static { GObject.registerClass({ GTypeName: `Ags${W.name}` }, this); }
        constructor(props: BaseProps<InstanceType<T> & Widget> & Props) {
            super(props as Gtk.Widget.ConstructorProperties);
        }
    }
    return (props: BaseProps<InstanceType<T> & Widget> & Props) => new Widget(props) as InstanceType<T> & Widget;
}

export const Calendar = subclass<typeof Gtk.Calendar, Gtk.Calendar.ConstructorProperties>(Gtk.Calendar);
export const Fixed = subclass<typeof Gtk.Fixed, Gtk.Fixed.ConstructorProperties>(Gtk.Fixed);
export const MenuBar = subclass<typeof Gtk.MenuBar, Gtk.MenuBar.ConstructorProperties>(Gtk.MenuBar);
export const Switch = subclass<typeof Gtk.Switch, Gtk.Switch.ConstructorProperties>(Gtk.Switch);
export const ToggleButton = subclass<typeof Gtk.ToggleButton, Gtk.ToggleButton.ConstructorProperties>(Gtk.ToggleButton);

Widget.Calendar = Calendar;
Widget.Fixed = Fixed;
Widget.MenuBar = MenuBar;
Widget.Switch = Switch;
Widget.ToggleButton = ToggleButton;

export default Widget;
