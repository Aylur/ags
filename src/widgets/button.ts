import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import { runCmd } from '../utils.js';
import { Command } from './constructor.js';

export default class AgsButton extends Gtk.Button {
    static {
        GObject.registerClass({ GTypeName: 'AgsButton' }, this);
    }

    onClicked: Command;
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
        onClicked = '',
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
        ...rest
    } = {}) {
        super(rest);
        this.add_events(Gdk.EventMask.SCROLL_MASK);
        this.add_events(Gdk.EventMask.SMOOTH_SCROLL_MASK);

        this.onClicked = onClicked;
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

        this.connect('clicked', (...args) => runCmd(this.onClicked, ...args));

        this.connect('enter-notify-event', (btn, event) => {
            return runCmd(this.onHover, btn, event);
        });

        this.connect('leave-notify-event', (btn, event) => {
            return runCmd(this.onHoverLost, btn, event);
        });

        this.connect('button-press-event', (_, event: Gdk.Event) => {
            if (this.onPrimaryClick &&
                event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return runCmd(this.onPrimaryClick, this, event);

            else if (this.onSecondaryClick &&
                event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return runCmd(this.onSecondaryClick, this, event);

            else if (this.onMiddleClick &&
                event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return runCmd(this.onMiddleClick, this, event);
        });

        this.connect('button-release-event', (_, event: Gdk.Event) => {
            if (this.onPrimaryClickRelease &&
                event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return runCmd(this.onPrimaryClickRelease, this, event);

            else if (this.onSecondaryClickRelease &&
                event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return runCmd(this.onSecondaryClickRelease, this, event);

            else if (this.onMiddleClickRelease &&
                event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return runCmd(this.onMiddleClickRelease, this, event);
        });

        this.connect('scroll-event', (box, event) => {
            if (event.get_scroll_deltas()[2] < 0)
                return runCmd(this.onScrollUp, box, event);
            else if (event.get_scroll_deltas()[2] > 0)
                return runCmd(this.onScrollDown, box, event);
        });
    }
}
