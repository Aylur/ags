import Gtk from 'gi://Gtk?version=3.0';
import { Command } from './constructor.js';
export default class AgsEventBox extends Gtk.EventBox {
    onPrimaryClick: Command;
    onSecondaryClick: Command;
    onMiddleClick: Command;
    onPrimaryClickRelease: Command;
    onSecondaryClickRelease: Command;
    onMiddleClickRelease: Command;
    onHover: Command;
    onHoverLost: Command;
    onScrollUp: Command;
    onScrollDown: Command;
    constructor({ onPrimaryClick, onSecondaryClick, onMiddleClick, onPrimaryClickRelease, onSecondaryClickRelease, onMiddleClickRelease, onHover, onHoverLost, onScrollUp, onScrollDown, ...params }?: {
        onPrimaryClick?: string | undefined;
        onSecondaryClick?: string | undefined;
        onMiddleClick?: string | undefined;
        onPrimaryClickRelease?: string | undefined;
        onSecondaryClickRelease?: string | undefined;
        onMiddleClickRelease?: string | undefined;
        onHover?: string | undefined;
        onHoverLost?: string | undefined;
        onScrollUp?: string | undefined;
        onScrollDown?: string | undefined;
    });
}
