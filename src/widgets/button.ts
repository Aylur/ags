import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import { runCmd } from '../utils.js';

export default class Button extends Gtk.Button {
    static {
        GObject.registerClass({ GTypeName: 'AgsButton' }, this);
    }

    onClicked: string | ((...args: any[]) => boolean);
    onPrimaryClick: string | ((...args: any[]) => boolean);
    onSecondaryClick: string | ((...args: any[]) => boolean);
    onMiddleClick: string | ((...args: any[]) => boolean);
    onPrimaryClickRelease: string | ((...args: any[]) => boolean);
    onSecondaryClickRelease: string | ((...args: any[]) => boolean);
    onMiddleClickRelease: string | ((...args: any[]) => boolean);
    onScrollUp: string | ((...args: any[]) => boolean);
    onScrollDown: string | ((...args: any[]) => boolean);

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
        } = params as { [key: string]: any };

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
    }

    // @ts-ignore
    get child() { return this.get_child(); }
    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget)
            this.remove(widget);

        if (child)
            this.add(child);
    }

    vfunc_clicked(): void {
        runCmd(this.onClicked, this);
    }

    vfunc_button_press_event(event: Gdk.EventButton): boolean {
        super.vfunc_button_press_event(event);
        this.set_state_flags(Gtk.StateFlags.ACTIVE, false);
        if (event.button === Gdk.BUTTON_PRIMARY)
            return runCmd(this.onPrimaryClick, this, event);

        else if (event.button === Gdk.BUTTON_SECONDARY)
            return runCmd(this.onSecondaryClick, this, event);

        else if (event.button === Gdk.BUTTON_MIDDLE)
            return runCmd(this.onMiddleClick, this, event);

        return false;
    }

    vfunc_button_release_event(event: Gdk.EventButton): boolean {
        super.vfunc_button_release_event(event);
        this.unset_state_flags(Gtk.StateFlags.ACTIVE);
        if (event.button === Gdk.BUTTON_PRIMARY)
            return runCmd(this.onPrimaryClickRelease, this, event);

        else if (event.button === Gdk.BUTTON_SECONDARY)
            return runCmd(this.onSecondaryClickRelease, this, event);

        else if (event.button === Gdk.BUTTON_MIDDLE)
            return runCmd(this.onMiddleClickRelease, this, event);

        return false;
    }

    vfunc_scroll_event(event: Gdk.EventScroll): boolean {
        if (event.direction === Gdk.ScrollDirection.UP)
            return runCmd(this.onScrollUp, this, event);

        else if (event.direction === Gdk.ScrollDirection.DOWN)
            return runCmd(this.onScrollDown, this, event);

        return false;
    }
}
