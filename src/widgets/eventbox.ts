import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import { runCmd } from '../utils.js';
import { Command } from './shared.js';

export default class AgsEventBox extends Gtk.EventBox {
    static {
        GObject.registerClass({ GTypeName: 'AgsEventBox' }, this);
    }

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

    constructor({
        onPrimaryClick = '',
        onSecondaryClick = '',
        onMiddleClick = '',
        onPrimaryClickRelease = '',
        onSecondaryClickRelease = '',
        onMiddleClickRelease = '',
        onHover = '',
        onHoverLost = '',
        onScrollUp = '',
        onScrollDown = '',
        ...params
    } = {}) {
        super(params);
        this.add_events(Gdk.EventMask.SCROLL_MASK);

        this.onPrimaryClick = onPrimaryClick;
        this.onSecondaryClick = onSecondaryClick;
        this.onMiddleClick = onMiddleClick;
        this.onPrimaryClickRelease = onPrimaryClickRelease;
        this.onSecondaryClickRelease = onSecondaryClickRelease;
        this.onMiddleClickRelease = onMiddleClickRelease;
        this.onHover = onHover;
        this.onHoverLost = onHoverLost;
        this.onScrollUp = onScrollUp;
        this.onScrollDown = onScrollDown;

        this.connect('enter-notify-event', (box, event) => {
            box.set_state_flags(Gtk.StateFlags.PRELIGHT, false);
            return runCmd(this.onHover, box, event);
        });

        this.connect('leave-notify-event', (box, event) => {
            box.unset_state_flags(Gtk.StateFlags.PRELIGHT);
            return runCmd(this.onHoverLost, box, event);
        });

        this.connect('button-press-event', (box, event) => {
            box.set_state_flags(Gtk.StateFlags.ACTIVE, false);
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return runCmd(this.onPrimaryClick, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return runCmd(this.onSecondaryClick, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return runCmd(this.onMiddleClick, box, event);
        });

        this.connect('button-release-event', (box, event) => {
            box.unset_state_flags(Gtk.StateFlags.ACTIVE);
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return runCmd(this.onPrimaryClickRelease, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return runCmd(this.onSecondaryClickRelease, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return runCmd(this.onMiddleClickRelease, box, event);
        });

        this.connect('scroll-event', (box, event) => {
            if (event.get_scroll_direction()[1] ===
                Gdk.ScrollDirection.UP)
                return runCmd(this.onScrollUp, box, event);
            else if (event.get_scroll_direction()[1] ===
                Gdk.ScrollDirection.DOWN)
                return runCmd(this.onScrollDown, box, event);
        });
    }
}
