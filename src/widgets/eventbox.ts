import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';

type EventHandler = (self: AgsEventBox, event: Gdk.Event) => boolean | unknown;

export interface EventBoxProps extends BaseProps<AgsEventBox>, Gtk.EventBox.ConstructorProperties {
    on_hover?: EventHandler
    on_hover_lost?: EventHandler

    on_scroll_up?: EventHandler
    on_scroll_down?: EventHandler

    on_primary_click?: EventHandler
    on_middle_click?: EventHandler
    on_secondary_click?: EventHandler

    on_primary_click_release?: EventHandler
    on_middle_click_release?: EventHandler
    on_secondary_click_release?: EventHandler
}

export default class AgsEventBox extends AgsWidget(Gtk.EventBox) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsEventBox',
            Properties: {
                'on-hover':
                    Service.pspec('on-hover', 'jsobject', 'rw'),
                'on-hover-lost':
                    Service.pspec('on-hover-lost', 'jsobject', 'rw'),

                'on-scroll-up':
                    Service.pspec('on-scroll-up', 'jsobject', 'rw'),
                'on-scroll-down':
                    Service.pspec('on-scroll-down', 'jsobject', 'rw'),

                'on-primary-click':
                    Service.pspec('on-primary-click', 'jsobject', 'rw'),
                'on-secondary-click':
                    Service.pspec('on-secondary-click', 'jsobject', 'rw'),
                'on-middle-click':
                    Service.pspec('on-middle-click', 'jsobject', 'rw'),

                'on-primary-click-release':
                    Service.pspec('on-primary-click-release', 'jsobject', 'rw'),
                'on-secondary-click-release':
                    Service.pspec('on-secondary-click-release', 'jsobject', 'rw'),
                'on-middle-click-release':
                    Service.pspec('on-middle-click-release', 'jsobject', 'rw'),
            },
        }, this);
    }

    constructor(props: EventBoxProps = {}) {
        super(props);
        this.add_events(Gdk.EventMask.SCROLL_MASK);
        this.add_events(Gdk.EventMask.SMOOTH_SCROLL_MASK);

        this.connect('enter-notify-event', (_, event: Gdk.Event) => {
            this.set_state_flags(Gtk.StateFlags.PRELIGHT, false);
            return this.on_hover?.(this, event);
        });

        this.connect('leave-notify-event', (_, event: Gdk.Event) => {
            this.unset_state_flags(Gtk.StateFlags.PRELIGHT);
            return this.on_hover_lost?.(this, event);
        });

        this.connect('button-press-event', (_, event: Gdk.Event) => {
            this.set_state_flags(Gtk.StateFlags.ACTIVE, false);
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return this.on_primary_click?.(this, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return this.on_middle_click?.(this, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return this.on_secondary_click?.(this, event);
        });

        this.connect('button-release-event', (_, event: Gdk.Event) => {
            this.unset_state_flags(Gtk.StateFlags.ACTIVE);
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return this.on_primary_click_release?.(this, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return this.on_middle_click_release?.(this, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return this.on_secondary_click_release?.(this, event);
        });

        this.connect('scroll-event', (_, event: Gdk.Event) => {
            if (event.get_scroll_deltas()[2] < 0)
                return this.on_scroll_up?.(this, event);

            else if (event.get_scroll_deltas()[2] > 0)
                return this.on_scroll_down?.(this, event);
        });
    }

    get on_hover() { return this._get('on-hover'); }
    set on_hover(callback: EventHandler) {
        this._set('on-hover', callback);
    }

    get on_hover_lost() { return this._get('on-hover-lost'); }
    set on_hover_lost(callback: EventHandler) {
        this._set('on-hover-lost', callback);
    }

    get on_scroll_up() { return this._get('on-scroll-up'); }
    set on_scroll_up(callback: EventHandler) {
        this._set('on-scroll-up', callback);
    }

    get on_scroll_down() { return this._get('on-scroll-down'); }
    set on_scroll_down(callback: EventHandler) {
        this._set('on-scroll-down', callback);
    }

    get on_primary_click() { return this._get('on-primary-click'); }
    set on_primary_click(callback: EventHandler) {
        this._set('on-primary-click', callback);
    }

    get on_middle_click() { return this._get('on-middle-click'); }
    set on_middle_click(callback: EventHandler) {
        this._set('on-middle-click', callback);
    }

    get on_secondary_click() { return this._get('on-secondary-click'); }
    set on_secondary_click(callback: EventHandler) {
        this._set('on-secondary-click', callback);
    }

    get on_primary_click_release() { return this._get('on-primary-click-release'); }
    set on_primary_click_release(callback: EventHandler) {
        this._set('on-primary-click-release', callback);
    }

    get on_middle_click_release() { return this._get('on-middle-click-release'); }
    set on_middle_click_release(callback: EventHandler) {
        this._set('on-middle-click-release', callback);
    }

    get on_secondary_click_release() { return this._get('on-secondary-click-release'); }
    set on_secondary_click_release(callback: EventHandler) {
        this._set('on-secondary-click-release', callback);
    }
}
