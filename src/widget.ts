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
import AgsWidget, { type BaseProps } from './widgets/widget.js';
import type Gtk from 'gi://Gtk';

export function createConstructor<
    Output extends InstanceType<typeof Gtk.Widget>,
    Props extends BaseProps<Output> | ConstructorParameters<Class>[0],
    Class extends typeof Gtk.Widget & (new (arg: Omit<Props, keyof BaseProps<Output>>) => InstanceType<Class> & Output),
>(w: Class, name?: string) {
    const Ctor = AgsWidget<Class, Props>(w, name);
    return (props: Props & BaseProps<typeof w>) => new Ctor(props) as InstanceType<Class>;
}

function _Widget<
    Output extends InstanceType<typeof Gtk.Widget>,
    Props extends BaseProps<Output> | ConstructorParameters<Class>[0],
    Class extends typeof Gtk.Widget & (new (arg: Omit<Props, keyof BaseProps<Output>>) => InstanceType<Class> & Output),
>({type, ...params}: { type: Class } & Props) {
    return createConstructor<
        Output,
        Props,
        Class
    >(type)(params as unknown as Props & BaseProps<typeof type>);
}

// @ts-expect-error custom overrides
export const Window = createConstructor(AgsWindow, 'AgsWindow');

export const Box = createConstructor(AgsBox, 'AgsBox');
export const Button = createConstructor(AgsButton, 'AgsButton');
export const CenterBox = createConstructor(AgsCenterBox, 'AgsCenterBox');
export const CircularProgress = createConstructor(AgsCircularProgress, 'AgsCircularProgress');
export const Entry = createConstructor(AgsEntry, 'AgsEntry');
export const EventBox = createConstructor(AgsEventBox, 'AgsEventBox');
export const Icon = createConstructor(AgsIcon, 'AgsIcon');
export const Label = createConstructor(AgsLabel, 'AgsLabel');
export const Menu = createConstructor(AgsMenu, 'AgsMenu');
export const MenuItem = createConstructor(AgsMenuItem, 'AgsMenuItem');
export const Overlay = createConstructor(AgsOverlay, 'AgsOverlay');
export const ProgressBar = createConstructor(AgsProgressBar, 'AgsProgressBar');
export const Revealer = createConstructor(AgsRevealer, 'AgsRevealer');
export const Scrollable = createConstructor(AgsScrollable, 'AgsScrollable');
export const Slider = createConstructor(AgsSlider, 'AgsSlider');
export const Stack = createConstructor(AgsStack, 'AgsStack');

// type duplication required for type inference (too many nodes otherwise)
const defaultWidgets: {
    Window: typeof Window,
    Box: typeof Box,
    Button: typeof Button,
    CenterBox: typeof CenterBox,
    CircularProgress: typeof CircularProgress,
    Entry: typeof Entry,
    EventBox: typeof EventBox,
    Icon: typeof Icon,
    Label: typeof Label,
    Menu: typeof Menu,
    MenuItem: typeof MenuItem,
    Overlay: typeof Overlay,
    ProgressBar: typeof ProgressBar,
    Revealer: typeof Revealer,
    Scrollable: typeof Scrollable,
    Slider: typeof Slider,
    Stack: typeof Stack,
} = {
    Window,
    Box,
    Button,
    CenterBox,
    CircularProgress,
    Entry,
    EventBox,
    Icon,
    Label,
    Menu,
    MenuItem,
    Overlay,
    ProgressBar,
    Revealer,
    Scrollable,
    Slider,
    Stack,
} as const

export const Widget: typeof _Widget & typeof defaultWidgets = Object.assign(_Widget, defaultWidgets);

export default Widget;