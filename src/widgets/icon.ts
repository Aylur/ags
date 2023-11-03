import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';
import cairo from '@girs/cairo-1.0';

interface Props extends BaseProps<AgsIcon>, Gtk.Image.ConstructorProperties {
    icon?: string | GdkPixbuf.Pixbuf
    size?: number
}

export type IconProps = Props | string | GdkPixbuf.Pixbuf | undefined

export default class AgsIcon extends AgsWidget(Gtk.Image) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsIcon',
            Properties: {
                'icon': Service.pspec('icon', 'jsobject', 'rw'),
                'type': Service.pspec('type', 'string', 'r'),
                'size': Service.pspec('size', 'double', 'rw'),
                'previous-size': Service.pspec('previous-size', 'double', 'r'),
            },
        }, this);
    }

    constructor(props: IconProps = {}) {
        const { icon = '', ...rest } = props as Props;
        super(typeof props === 'string' || props instanceof GdkPixbuf.Pixbuf ? {} : rest);

        // jsobject pspec can't take a string, so we have to set it after constructor
        this.icon = typeof props === 'string' || props instanceof GdkPixbuf.Pixbuf
            ? props : icon;
    }

    get size() { return this._get('size') || this._get('previous-size') || 0; }
    set size(size: number) {
        this._set('size', size);
        this.queue_draw();
    }

    get icon() { return this._get('icon'); }
    set icon(icon: string | GdkPixbuf.Pixbuf) {
        this._set('icon', icon);

        if (typeof icon === 'string') {
            if (GLib.file_test(icon, GLib.FileTest.EXISTS)) {
                this._set('type', 'file');
                if (this.size === 0)
                    return;

                const pb = GdkPixbuf.Pixbuf.new_from_file_at_size(
                    icon,
                    this.size * this.scale_factor,
                    this.size * this.scale_factor,
                );
                const cs = Gdk.cairo_surface_create_from_pixbuf(pb, 0, this.get_window());
                this.set_from_surface(cs);
            } else {
                this._set('type', 'named');
                this.icon_name = icon;
                this.pixel_size = this.size;
            }
        }
        else if (icon instanceof GdkPixbuf.Pixbuf) {
            this._set('type', 'pixbuf');
            if (this.size === 0)
                return;

            const pb_scaled = icon.scale_simple(
                this.size * this.scale_factor,
                this.size * this.scale_factor,
                GdkPixbuf.InterpType.BILINEAR,
            );
            if (pb_scaled) {
                const cs = Gdk.cairo_surface_create_from_pixbuf(pb_scaled, 0, this.get_window());
                this.set_from_surface(cs);
            }
        }
        else {
            console.error(Error(`expected Pixbuf or string for icon, but got ${typeof icon}`));
        }
    }

    vfunc_draw(cr: cairo.Context): boolean {
        if (this.size > 1)
            return super.vfunc_draw(cr);

        const size = this.get_style_context()
            .get_property('font-size', Gtk.StateFlags.NORMAL) as number;

        if (size === this._get('previous-size'))
            return super.vfunc_draw(cr);

        this._set('previous-size', size);

        switch (this._get('type')) {
            case 'file': {
                const pb = GdkPixbuf.Pixbuf.new_from_file_at_size(
                    this._get<string>('icon'),
                    size * this.scale_factor,
                    size * this.scale_factor);

                const cs = Gdk.cairo_surface_create_from_pixbuf(pb, 0, this.get_window());
                this.set_from_surface(cs);
                break;
            }
            case 'pixbuf': {
                const pb_scaled = this._get<GdkPixbuf.Pixbuf>('icon').scale_simple(
                    size * this.scale_factor,
                    size * this.scale_factor,
                    GdkPixbuf.InterpType.BILINEAR,
                );
                if (pb_scaled) {
                    const cs = Gdk.cairo_surface_create_from_pixbuf(
                        pb_scaled, 0, this.get_window(),
                    );
                    this.set_from_surface(cs);
                }
                break;
            }
            case 'named':
                this.set_pixel_size(size);
                break;

            default:
                break;
        }

        return super.vfunc_draw(cr);
    }
}
