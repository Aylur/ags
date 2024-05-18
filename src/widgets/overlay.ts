import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

export type OverlayProps<
    Child extends Gtk.Widget = Gtk.Widget,
    OverlayChild extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = Overlay<Child, OverlayChild, Attr>,
> = BaseProps<Self, Gtk.Overlay.ConstructorProperties & {
    pass_through?: boolean
    overlays?: OverlayChild[]
    overlay?: OverlayChild
    child?: Child
}, Attr>

export function newOverlay<
    Child extends Gtk.Widget = Gtk.Widget,
    OverlayChild extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof Overlay<Child, OverlayChild, Attr>>) {
    return new Overlay(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Overlay<Child, OverlayChild, Attr> extends Widget<Attr> { }
export class Overlay<
    Child extends Gtk.Widget,
    OverlayChild extends Gtk.Widget,
    Attr
> extends Gtk.Overlay {
    static {
        register(this, {
            properties: {
                'pass-through': ['boolean', 'rw'],
                'overlays': ['jsobject', 'rw'],
                'overlay': ['jsobject', 'rw'],
            },
        });
    }

    constructor(
        props: OverlayProps<Child, OverlayChild, Attr> = {},
        child?: Child,
        ...overlays: Gtk.Widget[]
    ) {
        if (child)
            props.child = child;

        if (overlays.length > 0)
            props.overlays = overlays as OverlayChild[];

        super(props as Gtk.Overlay.ConstructorProperties);
    }

    private _updatePassThrough() {
        this.get_children().forEach(ch =>
            this.set_overlay_pass_through(ch, this._get('pass-through')));
    }

    get pass_through() { return this._get('pass-through'); }
    set pass_through(passthrough: boolean) {
        if (this.pass_through === passthrough)
            return;

        this._set('pass-through', passthrough);
        this._updatePassThrough();
        this.notify('pass-through');
    }

    get overlay() { return this.overlays[0] as Child; }
    set overlay(overlay: Child) {
        this.overlays = [overlay];
        this.notify('overlay');
    }

    get overlays() {
        return this.get_children().filter(ch => ch !== this.child) as Child[];
    }

    set overlays(overlays: Child[]) {
        this.get_children()
            .filter(ch => ch !== this.child && !overlays.includes(ch as Child))
            .forEach(ch => ch.destroy());

        this.get_children()
            .filter(ch => ch !== this.child)
            .forEach(ch => this.remove(ch));

        overlays.forEach(ch => this.add_overlay(ch));
        this._updatePassThrough();
        this.notify('overlays');
    }
}

export default Overlay;
