/* eslint-disable max-len */
import Gtk from 'gi://Gtk?version=3.0';
import { register as registerClass, type BaseProps, type Widget as TWidget } from './widgets/widget.js';
import { Box as BoxClass, type BoxProps } from './widgets/box.js';
import { CenterBox as CenterBoxClass, type CenterBoxProps } from './widgets/centerbox.js';
import { EventBox as EventBoxClass, type EventBoxProps } from './widgets/eventbox.js';
import { Icon as IconClass, type IconProps } from './widgets/icon.js';
import { Label as LabelClass, type LabelProps } from './widgets/label.js';
import { Button as ButtonClass, type ButtonProps } from './widgets/button.js';
import { Slider as SliderClass, type SliderProps } from './widgets/slider.js';
import { Scrollable as ScrollableClass, type ScrollableProps } from './widgets/scrollable.js';
import { Stack as StackClass, type StackProps } from './widgets/stack.js';
import { Overlay as OverlayClass, type OverlayProps } from './widgets/overlay.js';
import { Revealer as RevealerClass, type RevealerProps } from './widgets/revealer.js';
import { ProgressBar as ProgressBarClass, type ProgressBarProps } from './widgets/progressbar.js';
import { Entry as EntryClass, type EntryProps } from './widgets/entry.js';
import { Menu as MenuClass, type MenuProps, MenuItem as MenuItemClass, type MenuItemProps } from './widgets/menu.js';
import { Window as WindowClass, type WindowProps } from './widgets/window.js';
import { CircularProgress as CircularProgressClass, type CircularProgressProps } from './widgets/circularprogress.js';
import * as Etc from './widgets/etc.js';

export const Window = <Child extends Gtk.Widget, Attr>(props?: WindowProps<Child, Attr>, child?: Child) => new WindowClass(props, child);
export const Box = <Child extends Gtk.Widget, Attr>(props?: BoxProps<Child, Attr> | Child[], ...children: Child[]) => new BoxClass(props, ...children);
export const Button = <Child extends Gtk.Widget, Attr>(props?: ButtonProps<Child, Attr>) => new ButtonClass(props);
export const CenterBox = <StartWidget extends Gtk.Widget, CenterWidget extends Gtk.Widget, EndWidget extends Gtk.Widget, Attr>(props?: CenterBoxProps<StartWidget, CenterWidget, EndWidget, Attr>, startWidget?: StartWidget, centerWidget?: CenterWidget, endWidget?: EndWidget) => new CenterBoxClass(props, startWidget, centerWidget, endWidget);
export const CircularProgress = <Child extends Gtk.Widget, Attr>(props?: CircularProgressProps<Child, Attr>, child?: Child) => new CircularProgressClass(props, child);
export const Entry = <Attr>(props?: EntryProps<Attr>) => new EntryClass(props);
export const EventBox = <Child extends Gtk.Widget, Attr>(props?: EventBoxProps<Child, Attr>) => new EventBoxClass(props);
export const Icon = <Attr>(props?: IconProps<Attr>) => new IconClass(props);
export const Label = <Attr>(props?: LabelProps<Attr>) => new LabelClass(props);
export const Menu = <Child extends Gtk.MenuItem, Attr>(props?: MenuProps<Child, Attr>, ...children: Child[]) => new MenuClass(props, ...children);
export const MenuItem = <Child extends Gtk.Widget, Attr>(props?: MenuItemProps<Child, Attr>, child?: Child) => new MenuItemClass(props, child);
export const Overlay = <Child extends Gtk.Widget, Attr>(props?: OverlayProps<Child, Attr>, ...children: Child[]) => new OverlayClass(props, ...children);
export const ProgressBar = <Attr>(props?: ProgressBarProps<Attr>) => new ProgressBarClass(props);
export const Revealer = <Child extends Gtk.Widget, Attr>(props?: RevealerProps<Child, Attr>, child?: Child) => new RevealerClass(props, child);
export const Scrollable = <Child extends Gtk.Widget, Attr>(props?: ScrollableProps<Child, Attr>, child?: Child) => new ScrollableClass(props, child);
export const Slider = <Attr>(props?: SliderProps<Attr>) => new SliderClass(props);
export const Stack = <Child extends Gtk.Widget, Attr>(props?: StackProps<Child, Attr>) => new StackClass(props);

export const Calendar = <Attr>(props?: Etc.CalendarProps<Attr>) => new Etc.Calendar(props);
export const ColorButton = <Attr>(props?: Etc.ColorButtonProps<Attr>) => new Etc.ColorButton(props);
export const DrawingArea = <Attr>(props?: Etc.DrawingAreaProps<Attr>) => new Etc.DrawingArea(props);
export const FileChooserButton = <Attr>(props?: Etc.FileChooserButtonProps<Attr>) => new Etc.FileChooserButton(props);
export const Fixed = <Attr>(props?: Etc.FixedProps<Attr>) => new Etc.Fixed(props);
export const FlowBox = <Attr>(props?: Etc.FlowBoxProps<Attr>) => new Etc.FlowBox(props);
export const FontButton = <Attr>(props?: Etc.FontButtonProps<Attr>) => new Etc.FontButton(props);
export const LevelBar = <Attr>(props?: Etc.LevelBarProps<Attr>) => new Etc.LevelBar(props);
export const ListBox = <Attr>(props?: Etc.ListBoxProps<Attr>) => new Etc.ListBox(props);
export const MenuBar = <Attr>(props?: Etc.MenuBarProps<Attr>) => new Etc.MenuBar(props);
export const Separator = <Attr>(props?: Etc.SeparatorProps<Attr>) => new Etc.Separator(props);
export const SpinButton = <Attr>(props?: Etc.SpinButtonProps<Attr>) => new Etc.SpinButton(props);
export const Spinner = <Attr>(props?: Etc.SpinnerProps<Attr>) => new Etc.Spinner(props);
export const Switch = <Attr>(props?: Etc.SwitchProps<Attr>) => new Etc.Switch(props);
export const ToggleButton = <Attr>(props?: Etc.ToggleButtonProps<Attr>) => new Etc.ToggleButton(props);

// ts can't compile export default { subclass, Box, Button ... }
// so we use a function and add members to it instead
// to bundle everything in a default export
export default function W<T extends { new(...args: any[]): Gtk.Widget }, Props>(Base: T, typename = Base.name) {
    class Subclassed extends Base {
        static { registerClass(this, { typename }); }
        constructor(...params: any[]) { super(...params); }
    }
    type Instance<Attr> = InstanceType<typeof Subclassed> & TWidget<Attr>;
    return <Attr>(props: BaseProps<Instance<Attr>, Props, Attr>) => {
        return new Subclassed(props) as Instance<Attr>;
    };
}

export const Widget = W;
export const register = registerClass;
W.register = register;
export const subclass = W;
W.subclass = W;

W.Box = Box;
W.Button = Button;
W.CenterBox = CenterBox;
W.CircularProgress = CircularProgress;
W.Entry = Entry;
W.EventBox = EventBox;
W.Icon = Icon;
W.Label = Label;
W.Menu = Menu;
W.MenuItem = MenuItem;
W.Overlay = Overlay;
W.ProgressBar = ProgressBar;
W.Revealer = Revealer;
W.Scrollable = Scrollable;
W.Slider = Slider;
W.Stack = Stack;
W.Window = Window;

W.Calendar = Calendar;
W.ColorButton = ColorButton;
W.DrawingArea = DrawingArea;
W.FileChooserButton = FileChooserButton;
W.Fixed = Fixed;
W.FlowBox = FlowBox;
W.FontButton = FontButton;
W.LevelBar = LevelBar;
W.ListBox = ListBox;
W.MenuBar = MenuBar;
W.Separator = Separator;
W.SpinButton = SpinButton;
W.Spinner = Spinner;
W.Switch = Switch;
W.ToggleButton = ToggleButton;
