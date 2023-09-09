import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import { Context } from 'gi-types/cairo1';

export default class AgsIcon extends Gtk.Image {
    static {
        GObject.registerClass({ GTypeName: 'AgsIcon' }, this);
    }

    _iconTheme?: Gtk.IconTheme;

    constructor(params: object | string | GdkPixbuf.Pixbuf) {
        const {
            icon = '',
            size = 0,
            iconThemePath = [],
            ...rest
        } = params as { icon: string | GdkPixbuf.Pixbuf, size: number,
            iconThemePath: string[] | string };
        super(typeof params === 'string' || params instanceof GdkPixbuf.Pixbuf ? {} : rest);

        this.size = size;
        if (iconThemePath) {
            if (typeof iconThemePath === 'string') {
                this._iconTheme = Gtk.IconTheme.new();
                this._iconTheme.set_search_path([iconThemePath]);
            }
            else {
                const itp = iconThemePath.filter(path => path && path !== '');
                if (itp.length > 0) {
                    this._iconTheme = Gtk.IconTheme.new();
                    this._iconTheme.set_search_path(itp);
                }
            }
        }
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
                this.set_from_pixbuf(
                    GdkPixbuf.Pixbuf.new_from_file_at_size(icon, this.size, this.size));
            } else {
                if (this._iconTheme &&
                    this._iconTheme.lookup_icon(
                        icon, this.size, Gtk.IconLookupFlags.FORCE_SIZE)) {
                    this._type = 'pixbuf';
                    //get the biggest size to avoid upscaling, which results in bad quality,
                    //alternatively reload icon in draw function.
                    const sizes = this._iconTheme.get_icon_sizes(icon);
                    const pixbuf = this._iconTheme.load_icon(
                        icon, Math.max(...sizes), Gtk.IconLookupFlags.FORCE_SIZE);
                    // @ts-expect-error
                    this._icon = pixbuf;
                    this.set_from_pixbuf(pixbuf);
                }
                else {
                    this._type = 'named';
                    this.icon_name = icon;
                    this.pixel_size = this.size;
                }
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

    get iconTheme() { return this._iconTheme?.get_search_path() || []; }

    set iconTheme(iconThemePath: string[]) {
        if (!iconThemePath || iconThemePath.length === 0)
            return;
        const itp = iconThemePath.filter(path => path && path !== '');
        if (itp.length > 0) {
            print(itp);
            this._iconTheme = Gtk.IconTheme.new();
            this._iconTheme.set_search_path(itp);
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
