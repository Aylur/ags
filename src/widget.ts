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
import { constructor, type ctor } from './widgets/constructor.js';

export default function Widget({ type, ...params }: { type: ctor }) {
    return constructor(type, params);
}

// @ts-expect-error
export const Window = (args: object) => constructor(AgsWindow, args);
export const Box = (args: object) => constructor(AgsBox, args);
export const Button = (args: object) => constructor(AgsButton, args);
export const CenterBox = (args: object) => constructor(AgsCenterBox, args);
export const CircularProgress = (args: object) => constructor(AgsCircularProgress, args);
export const Entry = (args: object) => constructor(AgsEntry, args);
export const EventBox = (args: object) => constructor(AgsEventBox, args);
export const Icon = (args: object) => constructor(AgsIcon, args);
export const Label = (args: object) => constructor(AgsLabel, args);
export const Menu = (args: object) => constructor(AgsMenu, args);
export const MenuItem = (args: object) => constructor(AgsMenuItem, args);
export const Overlay = (args: object) => constructor(AgsOverlay, args);
export const ProgressBar = (args: object) => constructor(AgsProgressBar, args);
export const Revealer = (args: object) => constructor(AgsRevealer, args);
export const Scrollable = (args: object) => constructor(AgsScrollable, args);
export const Slider = (args: object) => constructor(AgsSlider, args);
export const Stack = (args: object) => constructor(AgsStack, args);
