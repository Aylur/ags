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
import type Gtk from 'types/gtk-types/gtk-3.0.js';

export interface WidgetParams<T extends Gtk.Widget> extends CommonParams<T> {
    type: new(arg: Omit<WidgetParams<T>, keyof CommonParams<T> | "type">) => T;
}

export function Widget<
    Output extends InstanceType<typeof Gtk.Widget>,
    Params extends CommonParams<Output> | ConstructorParameters<Class>[0],
    Class extends new (arg: Omit<Params, keyof CommonParams<Output>>) => InstanceType<Class> & Output,
>({type, ...params}: { type: Class } & Params): InstanceType<Class> {
    return constructor<
        Output,
        Params,
        Class
    >(type, params as unknown as Params);
}

export default Widget;

const createConstructor = <
    Output extends InstanceType<typeof Gtk.Widget>,
    Params extends CommonParams<Output> | ConstructorParameters<Class>[0],
    Class extends new (arg: Omit<Params, keyof CommonParams<Output>>) => InstanceType<Class> & Output,
>(widget: Class) => (args: Params) => constructor(widget, args)


// @ts-expect-error custom overrides
export const Window = createConstructor(AgsWindow);

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