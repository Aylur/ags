import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';

type EventHandler<Self> = (self: Self, event: Gdk.Event) => boolean | unknown;

export type ButtonProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = Button<Child, Attr>,
> = BaseProps<Self, Gtk.Button.ConstructorProperties & {
    child?: Child
    on_clicked?: (self: Self) => void

    on_hover?: EventHandler<Self>
    on_hover_lost?: EventHandler<Self>

    on_scroll_up?: EventHandler<Self>
    on_scroll_down?: EventHandler<Self>

    on_primary_click?: EventHandler<Self>
    on_middle_click?: EventHandler<Self>
    on_secondary_click?: EventHandler<Self>

    on_primary_click_release?: EventHandler<Self>
    on_middle_click_release?: EventHandler<Self>
    on_secondary_click_release?: EventHandler<Self>
}, Attr>;

export function newButton<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof Button<Child, Attr>>) {
    return new Button(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Button<Child, Attr> extends Widget<Attr> { }
export class Button<Child extends Gtk.Widget, Attr> extends Gtk.Button {
    static {
        register(this, {
            properties: {
                'on-clicked': ['jsobject', 'rw'],

                'on-hover': ['jsobject', 'rw'],
                'on-hover-lost': ['jsobject', 'rw'],

                'on-scroll-up': ['jsobject', 'rw'],
                'on-scroll-down': ['jsobject', 'rw'],

                'on-primary-click': ['jsobject', 'rw'],
                'on-secondary-click': ['jsobject', 'rw'],
                'on-middle-click': ['jsobject', 'rw'],

                'on-primary-click-release': ['jsobject', 'rw'],
                'on-secondary-click-release': ['jsobject', 'rw'],
                'on-middle-click-release': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: ButtonProps<Child, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;

        super(props as Gtk.Button.ConstructorProperties);
        this.add_events(Gdk.EventMask.SCROLL_MASK);
        this.add_events(Gdk.EventMask.SMOOTH_SCROLL_MASK);

        this.connect('clicked', () => this.on_clicked?.(this));

        this.connect('enter-notify-event', (_, event: Gdk.Event) => {
            if (this.isHovered(event))
                return this.on_hover?.(this, event);
        });

        this.connect('leave-notify-event', (_, event: Gdk.Event) => {
            if (!this.isHovered(event))
                return this.on_hover_lost?.(this, event);
        });

        this.connect('button-press-event', (_, event: Gdk.Event) => {
            if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
                return this.on_primary_click?.(this, event);

            else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
                return this.on_middle_click?.(this, event);

            else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
                return this.on_secondary_click?.(this, event);
        });

        this.connect('button-release-event', (_, event: Gdk.Event) => {
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

    get child() { return super.child as Child; }
    set child(child: Child) { super.child = child; }

    get on_clicked() { return this._get('on-clicked'); }
    set on_clicked(callback: (self: this) => void) {
        this._set('on-clicked', callback);
    }

    get on_hover() { return this._get('on-hover'); }
    set on_hover(callback: EventHandler<this>) {
        this._set('on-hover', callback);
    }

    get on_hover_lost() { return this._get('on-hover-lost'); }
    set on_hover_lost(callback: EventHandler<this>) {
        this._set('on-hover-lost', callback);
    }

    get on_scroll_up() { return this._get('on-scroll-up'); }
    set on_scroll_up(callback: EventHandler<this>) {
        this._set('on-scroll-up', callback);
    }

    get on_scroll_down() { return this._get('on-scroll-down'); }
    set on_scroll_down(callback: EventHandler<this>) {
        this._set('on-scroll-down', callback);
    }

    get on_primary_click() { return this._get('on-primary-click'); }
    set on_primary_click(callback: EventHandler<this>) {
        this._set('on-primary-click', callback);
    }

    get on_middle_click() { return this._get('on-middle-click'); }
    set on_middle_click(callback: EventHandler<this>) {
        this._set('on-middle-click', callback);
    }

    get on_secondary_click() { return this._get('on-secondary-click'); }
    set on_secondary_click(callback: EventHandler<this>) {
        this._set('on-secondary-click', callback);
    }

    get on_primary_click_release() { return this._get('on-primary-click-release'); }
    set on_primary_click_release(callback: EventHandler<this>) {
        this._set('on-primary-click-release', callback);
    }

    get on_middle_click_release() { return this._get('on-middle-click-release'); }
    set on_middle_click_release(callback: EventHandler<this>) {
        this._set('on-middle-click-release', callback);
    }

    get on_secondary_click_release() { return this._get('on-secondary-click-release'); }
    set on_secondary_click_release(callback: EventHandler<this>) {
        this._set('on-secondary-click-release', callback);
    }
}

export default Button;
