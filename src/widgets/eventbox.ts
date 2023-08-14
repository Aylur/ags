import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import { runCmd } from '../utils.js';
import { separateCommon, parseCommon, CommonParams } from './shared.js';

interface Params extends CommonParams {
    [key: string]: any
}

class EventBox extends Gtk.EventBox {
    static {
        GObject.registerClass({ GTypeName: 'AgsEventBox' }, this);
    }

    onClick: string | ((...args: any[]) => void);
    onSecondaryClick: string | ((...args: any[]) => void);
    onMiddleClick: string | ((...args: any[]) => void);
    onClickRelease: string | ((...args: any[]) => void);
    onSecondaryClickRelease: string | ((...args: any[]) => void);
    onMiddleClickRelease: string | ((...args: any[]) => void);
    onHover: string | ((...args: any[]) => void);
    onHoverLost: string | ((...args: any[]) => void);
    onScrollUp: string | ((...args: any[]) => void);
    onScrollDown: string | ((...args: any[]) => void);

    constructor({
        onClick = '',
        onSecondaryClick = '',
        onMiddleClick = '',
        onClickRelease = '',
        onSecondaryClickRelease = '',
        onMiddleClickRelease = '',
        onHover = '',
        onHoverLost = '',
        onScrollUp = '',
        onScrollDown = '',
        ...params
    }: Params = {}) {
        const [common, rest] = separateCommon(params);
        super(rest);
        parseCommon(this, common);

        this.onClick = onClick;
        this.onSecondaryClick = onSecondaryClick;
        this.onMiddleClick = onMiddleClick;
        this.onClickRelease = onClickRelease;
        this.onSecondaryClickRelease = onSecondaryClickRelease;
        this.onMiddleClickRelease = onMiddleClickRelease;
        this.onHover = onHover;
        this.onHoverLost = onHoverLost;
        this.onScrollUp = onScrollUp;
        this.onScrollDown = onScrollDown;

        this.connect('enter-notify-event', (box, event) => {
            box.set_state_flags(Gtk.StateFlags.PRELIGHT, false);
            runCmd(this.onHover, box, event);
        });

        this.connect('leave-notify-event', (box, event) => {
            box.unset_state_flags(Gtk.StateFlags.PRELIGHT);
            runCmd(this.onHoverLost, box, event);
        });

        this.connect('button-press-event', (box, event) => {
            box.set_state_flags(Gtk.StateFlags.ACTIVE, false);
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                runCmd(this.onClick, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                runCmd(this.onSecondaryClick, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                runCmd(this.onMiddleClick, box, event);
        });

        this.connect('button-release-event', (box, event) => {
            box.unset_state_flags(Gtk.StateFlags.ACTIVE);
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                runCmd(this.onClickRelease, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                runCmd(this.onSecondaryClickRelease, box, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                runCmd(this.onMiddleClickRelease, box, event);
        });

        this.add_events(Gdk.EventMask.SCROLL_MASK);
        this.connect('scroll-event', (box, event) => {
            if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.UP)
                runCmd(this.onScrollUp, box, event);

            else if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.DOWN)
                runCmd(this.onScrollDown, box, event);
        });
    }
}

export default (params: object) => new EventBox(params);
