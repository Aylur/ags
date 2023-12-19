/* eslint-disable max-len */
import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject?version=2.0';
import AgsWidget, { type BaseProps, type Connectable } from './widgets/widget.js';
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

Widget.createCtor = createCtor;
export function createCtor<T extends { new(...args: any[]): any }>(Widget: T) {
    return (...props: ConstructorParameters<T>) => {
        return new Widget(...props) as InstanceType<T> & Connectable<InstanceType<T>>;
    };
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

export default Widget;

const ctors = new Map();
export function Widget<
    T extends typeof Gtk.Widget,
    Props = ConstructorParameters<T>[0],
>({ type, ...props }:
    { type: T } & Props,
) {
    console.warn('Calling Widget({ type }) is deprecated. ' +
        `Use Widget.subclass instead, or open up an issue/PR to include ${type.name} on Widget`);

    if (ctors.has(type))
        // @ts-expect-error
        return new ctors.get(type)(props);

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

Widget.subclass = subclass;
export function subclass<T extends typeof Gtk.Widget, Props>(W: T, GTypeName = W.name) {
    class Widget extends AgsWidget(W) {
        static { GObject.registerClass({ GTypeName }, this); }
        constructor(props?: BaseProps<Widget, Props>) {
            super(props as Gtk.Widget.ConstructorProperties);
        }
    }
    return (props?: BaseProps<Widget, Props>) => {
        return new Widget(props) as Widget & Connectable<Widget>;
    };
}

export const Calendar = subclass<typeof Gtk.Calendar, Gtk.Calendar.ConstructorProperties>(Gtk.Calendar);
Widget.Calendar = Calendar;

export const ColorButton = subclass<typeof Gtk.ColorButton, Gtk.ColorButton.ConstructorProperties>(Gtk.ColorButton);
Widget.ColorButton = ColorButton;

export const DrawingArea = subclass<typeof Gtk.DrawingArea, Gtk.DrawingArea.ConstructorProperties>(Gtk.DrawingArea);
Widget.DrawingArea = DrawingArea;

export const FileChooserButton = subclass<typeof Gtk.FileChooserButton, Gtk.FileChooserButton.ConstructorProperties>(Gtk.FileChooserButton);
Widget.FileChooserButton = FileChooserButton;

export const Fixed = subclass<typeof Gtk.Fixed, Gtk.Fixed.ConstructorProperties>(Gtk.Fixed);
Widget.Fixed = Fixed;

export const FlowBox = subclass<typeof Gtk.FlowBox, Gtk.FlowBox.ConstructorProperties>(Gtk.FlowBox);
Widget.FlowBox = FlowBox;

export const FontButton = subclass<typeof Gtk.FontButton, Gtk.FontButton.ConstructorProperties>(Gtk.FontButton);
Widget.FontButton = FontButton;

export const LevelBar = subclass<typeof Gtk.LevelBar, Gtk.LevelBar.ConstructorProperties>(Gtk.LevelBar);
Widget.LevelBar = LevelBar;

export const ListBox = subclass<typeof Gtk.ListBox, Gtk.ListBox.ConstructorProperties>(Gtk.ListBox);
Widget.ListBox = ListBox;

export const MenuBar = subclass<typeof Gtk.MenuBar, Gtk.MenuBar.ConstructorProperties>(Gtk.MenuBar);
Widget.MenuBar = MenuBar;

export const Separator = subclass<typeof Gtk.Separator, Gtk.Separator.ConstructorProperties>(Gtk.Separator);
Widget.Separator = Separator;

export const SpinButton = subclass<typeof Gtk.SpinButton, Gtk.SpinButton.ConstructorProperties>(Gtk.SpinButton);
Widget.SpinButton = SpinButton;

export const Spinner = subclass<typeof Gtk.Spinner, Gtk.Spinner.ConstructorProperties>(Gtk.Spinner);
Widget.Spinner = Spinner;

export const Switch = subclass<typeof Gtk.Switch, Gtk.Switch.ConstructorProperties>(Gtk.Switch);
Widget.Switch = Switch;

export const ToggleButton = subclass<typeof Gtk.ToggleButton, Gtk.ToggleButton.ConstructorProperties>(Gtk.ToggleButton);
Widget.ToggleButton = ToggleButton;
