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
                'size': Service.pspec('size', 'double', 'rw'),
                'icon': Service.pspec('icon', 'jsobject', 'rw'),
                'type': Service.pspec('type', 'string', 'r'),
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

    get size() { return this._get('size') || this._fontSize || 0; }
    set size(size: number) { this._set('size', size); }

    get icon() { return this._get('icon'); }
    set icon(icon: string | GdkPixbuf.Pixbuf) {
        this._set('icon', icon);

        if (typeof icon === 'string') {
            if (GLib.file_test(icon, GLib.FileTest.EXISTS))
                this._set('type', 'file');
            else
                this._set('type', 'named');
        }
        else if (icon instanceof GdkPixbuf.Pixbuf) {
            this._set('type', 'pixbuf');
        }
        else {
            console.error(Error(`expected Pixbuf or string for icon, but got ${typeof icon}`));
        }

        this._size();
    }

    private _previousSize = 0;
    private _fontSize = 0;
    private _size() {
        if (this.size === 0)
            return;

        const type = this._get<'file' | 'named' | 'pixbuf'>('type');
        this._previousSize = this.size;

        if (type === 'file') {
            const pb = GdkPixbuf.Pixbuf.new_from_file_at_size(
                this.icon as string,
                this.size * this.scale_factor,
                this.size * this.scale_factor,
            );
            const cs = Gdk.cairo_surface_create_from_pixbuf(pb, 0, this.get_window());
            this.set_from_surface(cs);
        }

        else if (type === 'named') {
            this.icon_name = this.icon as string;
            this.pixel_size = this.size;
        }

        else if (type === 'pixbuf') {
            const pb_scaled = (this.icon as GdkPixbuf.Pixbuf).scale_simple(
                this.size * this.scale_factor,
                this.size * this.scale_factor,
                GdkPixbuf.InterpType.BILINEAR,
            );
            if (pb_scaled) {
                const cs = Gdk.cairo_surface_create_from_pixbuf(pb_scaled, 0, this.get_window());
                this.set_from_surface(cs);
            }
        }
    }

    vfunc_draw(cr: cairo.Context): boolean {
        this._fontSize = this.get_style_context()
            .get_property('font-size', Gtk.StateFlags.NORMAL) as number;

        if (this._previousSize !== this.size)
            this._size();

        return super.vfunc_draw(cr);
    }
}
