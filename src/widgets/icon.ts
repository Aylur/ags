import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import { Context } from 'gi-types/cairo1';

export default class AgsIcon extends Gtk.Image {
    static {
        GObject.registerClass({
            GTypeName: 'AgsIcon',
            Properties: {
                'size': GObject.ParamSpec.int(
                    'size', 'Size', 'Size',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    0, 1024, 0,
                ),
            },
        }, this);
    }

    constructor(params: object | string) {
        const {
            icon = '',
            size = 0,
        } = params as { icon: string | GdkPixbuf.Pixbuf, size: number };
        super(typeof params === 'string' ? { icon: params } : params);

        // set correct size after construct
        if (typeof params === 'object') {
            this.size = size;
            this.icon = icon;
        }
    }

    _size = 0;
    _previousSize = 0;
    get size() { return this._size || this._previousSize || 13; }
    set size(size: number) {
        size ||= 0;
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
                this.set_from_pixbuf(
                    GdkPixbuf.Pixbuf.new_from_file_at_size(icon, this.size, this.size));
            } else {
                this._type = 'named';
                this.icon_name = icon;
                this.pixel_size = this.size;
            }
        }
        else if (icon instanceof GdkPixbuf.Pixbuf) {
            this._type = 'pixbuf';
            this.set_from_pixbuf(
                icon.scale_simple(this.size, this.size, GdkPixbuf.InterpType.BILINEAR));
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
                this.set_from_pixbuf(
                    GdkPixbuf.Pixbuf.new_from_file_at_size(this.icon as string, size, size));
                break;
            case 'pixbuf':
                this.set_from_pixbuf((this.icon as GdkPixbuf.Pixbuf).scale_simple(
                    this.size, this.size, GdkPixbuf.InterpType.BILINEAR));
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
