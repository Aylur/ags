import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import { runCmd } from '../utils.js';
import { Command } from './shared.js';

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
    onScrollUp: Command;
    onScrollDown: Command;

    constructor(params: object | string) {
        const {
            onClicked = '',
            onPrimaryClick = '',
            onSecondaryClick = '',
            onMiddleClick = '',
            onPrimaryClickRelease = '',
            onSecondaryClickRelease = '',
            onMiddleClickRelease = '',
            onScrollUp = '',
            onScrollDown = '',
            ...rest
        } = params as { [key: string]: Command };

        super(typeof params === 'string' ? { label: params } : rest);
        this.add_events(Gdk.EventMask.SCROLL_MASK);
        this.onClicked = onClicked;
        this.onPrimaryClick = onPrimaryClick;
        this.onSecondaryClick = onSecondaryClick;
        this.onMiddleClick = onMiddleClick;
        this.onPrimaryClickRelease = onPrimaryClickRelease;
        this.onSecondaryClickRelease = onSecondaryClickRelease;
        this.onMiddleClickRelease = onMiddleClickRelease;
        this.onScrollUp = onScrollUp;
        this.onScrollDown = onScrollDown;

        this.connect('clicked', (...args) => runCmd(this.onClicked, ...args));

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
    }

    // @ts-ignore
    get child() { return this.get_child(); }
    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget)
            widget.destroy();

        if (child)
            this.add(child);
    }

    vfunc_scroll_event(event: Gdk.EventScroll): boolean {
        if (this.onScrollUp &&
            event.direction === Gdk.ScrollDirection.UP)
            return runCmd(this.onScrollUp, this, event);

        else if (this.onScrollDown &&
            event.direction === Gdk.ScrollDirection.DOWN)
            return runCmd(this.onScrollDown, this, event);

        return super.vfunc_scroll_event(event);
    }
}
