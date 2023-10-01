import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gdk from 'gi://Gdk?version=3.0';
import { Context } from 'gi-types/cairo1';

export default class AgsIcon extends Gtk.Image {
    static {
        GObject.registerClass({ GTypeName: 'AgsIcon' }, this);
    }

    constructor(params: object | string | GdkPixbuf.Pixbuf) {
        const {
            icon = '',
            size = 0,
            ...rest
        } = params as { icon: string | GdkPixbuf.Pixbuf, size: number };
        super(typeof params === 'string' || params instanceof GdkPixbuf.Pixbuf ? {} : rest);

        this.size = size;
        this.icon = typeof params === 'string' || params instanceof GdkPixbuf.Pixbuf
            ? params : icon;
    }

    _size = 0;
    _previousSize = 0;
    get size() { return this._size || this._previousSize || 13; }
    set size(size: number) {
        this._size = size;
        this.queue_draw();
    }

    _type!: 'file' | 'named' | 'pixbuf';
    _icon: string | GdkPixbuf.Pixbuf = '';
    get icon() { return this._icon; }
    set icon(icon: string | GdkPixbuf.Pixbuf) {
        if (!icon || this._icon === icon)
            return;

        this._icon = icon;
        if (typeof icon === 'string') {
            if (GLib.file_test(icon, GLib.FileTest.EXISTS)) {
                this._type = 'file';
                const pb =
                    GdkPixbuf.Pixbuf.new_from_file_at_size(
                        this.icon as string,
                        this.size * this.scale_factor,
                        this.size  * this.scale_factor);
                const cs = Gdk.cairo_surface_create_from_pixbuf(pb, 0, this.get_window());
                this.set_from_surface(cs);
            } else {
                this._type = 'named';
                this.icon_name = icon;
                this.pixel_size = this.size;
            }
        }
        else if (icon instanceof GdkPixbuf.Pixbuf) {
            this._type = 'pixbuf';
            const pb_scaled =
                icon.scale_simple(
                    this.size * this.scale_factor,
                    this.size * this.scale_factor,
                    GdkPixbuf.InterpType.BILINEAR);
            if (pb_scaled) {
                const cs = Gdk.cairo_surface_create_from_pixbuf(pb_scaled, 0, this.get_window());
                this.set_from_surface(cs);
            }
        }
        else {
            logError(new Error(`expected Pixbuf or string for icon, but got ${typeof icon}`));
        }
    }

    vfunc_draw(cr: Context): boolean {
        if (this._size > 1)
            return super.vfunc_draw(cr);

        const size = this.get_style_context()
            .get_property('font-size', Gtk.StateFlags.NORMAL) as number;

        if (size === this._previousSize)
            return super.vfunc_draw(cr);

        this._previousSize = size;

        switch (this._type) {
            case 'file':
                // eslint-disable-next-line no-case-declarations
                const pb = GdkPixbuf.Pixbuf.new_from_file_at_size(
                    this.icon as string,
                    size * this.scale_factor,
                    size * this.scale_factor);
                // eslint-disable-next-line no-case-declarations
                const cs = Gdk.cairo_surface_create_from_pixbuf(pb, 0, this.get_window());
                this.set_from_surface(cs);
                break;
            case 'pixbuf':
                // eslint-disable-next-line no-case-declarations
                const pb_scaled =
                    (this.icon as GdkPixbuf.Pixbuf).scale_simple(
                        size * this.scale_factor,
                        size * this.scale_factor,
                        GdkPixbuf.InterpType.BILINEAR);
                if (pb_scaled) {
                    const cs = Gdk.cairo_surface_create_from_pixbuf(
                        pb_scaled, 0, this.get_window());
                    this.set_from_surface(cs);
                }
                break;
            case 'named':
                this.set_pixel_size(size);
                break;
            default:
                break;
        }

        return super.vfunc_draw(cr);
    }
}
