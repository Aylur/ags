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
import { constructor, CommonParams } from './widgets/constructor.js';
import type Gtk from '@girs/gtk-3.0';

export default function Widget<
    Output extends Gtk.Widget,
    Params extends CommonParams,
    Class extends new(arg: Omit<Params, keyof CommonParams>) => Output,
>(params: { type: Class } & Params): InstanceType<Class> {
    return constructor(params.type, params);
}

const createConstructor = <
    Output extends Gtk.Widget,
    Params extends CommonParams & ConstructorParameters<Class>[0],
    Class extends new(arg: Omit<Params, keyof CommonParams>) => Output,
>(widget: Class) => (args: Params) => constructor(widget, args)


// @ts-expect-error
export const Window = createConstructor(AgsWindow, args);

export const Box = createConstructor(AgsBox);
export const Button = createConstructor(AgsButton);
export const CenterBox = createConstructor(AgsCenterBox);
export const CircularProgress = createConstructor(AgsCircularProgress);
export const Entry = createConstructor(AgsEntry);
export const EventBox = createConstructor(AgsEventBox);
export const Icon = createConstructor(AgsIcon);
export const Label = createConstructor(AgsLabel);
export const Menu = createConstructor(AgsMenu);
export const MenuItem = createConstructor(AgsMenuItem);
export const Overlay = createConstructor(AgsOverlay);
export const ProgressBar = createConstructor(AgsProgressBar);
export const Revealer = createConstructor(AgsRevealer);
export const Scrollable = createConstructor(AgsScrollable);
export const Slider = createConstructor(AgsSlider);
export const Stack = createConstructor(AgsStack);
