import Gtk from 'gi://Gtk?version=3.0';
import Box from './widgets/box.js';
import CenterBox from './widgets/centerbox.js';
import EventBox from './widgets/eventbox.js';
import Icon from './widgets/icon.js';
import Label from './widgets/label.js';
import Button from './widgets/button.js';
import Slider from './widgets/slider.js';
import Scrollable from './widgets/scrollable.js';
import Stack from './widgets/stack.js';
import Overlay from './widgets/overlay.js';
import Revealer from './widgets/revealer.js';
import ProgressBar from './widgets/progressbar.js';
import Entry from './widgets/entry.js';
import { Menu, MenuItem } from './widgets/menu.js';
import Window from './widgets/window.js';
import constructor from './widgets/shared.js';

interface Params {
    type: {
        new(...args: any[]): Gtk.Widget
    }
}

export default function Widget({ type, ...params }: Params) {
    return constructor(type, params);
}

Widget.Box = (params: object) => constructor(Box, params);
Widget.Button = (params: object) => constructor(Button, params);
Widget.CenterBox = (params: object) => constructor(CenterBox, params);
Widget.Entry = (params: object) => constructor(Entry, params);
Widget.EventBox = (params: object) => constructor(EventBox, params);
Widget.Icon = (params: object) => constructor(Icon, params);
Widget.Label = (params: object) => constructor(Label, params);
Widget.Menu = (params: object) => constructor(Menu, params);
Widget.MenuItem = (params: object) => constructor(MenuItem, params);
Widget.Overlay = (params: object) => constructor(Overlay, params);
Widget.ProgressBar = (params: object) => constructor(ProgressBar, params);
Widget.Revealer = (params: object) => constructor(Revealer, params);
Widget.Scrollable = (params: object) => constructor(Scrollable, params);
Widget.Slider = (params: object) => constructor(Slider, params);
Widget.Stack = (params: object) => constructor(Stack, params);
Widget.Window = (params: object) => constructor(Window, params);
