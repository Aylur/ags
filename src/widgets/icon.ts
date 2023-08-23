import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';

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
                'icon': GObject.ParamSpec.string(
                    'icon', 'Icon', 'Icon',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    '',
                ),
            },
        }, this);
    }

    constructor(params: object | string) {
        const {
            icon = '',
            size = 0,
        } = params as { icon: string, size: number };
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

    _file = false;
    _icon = '';
    get icon() { return this._icon; }
    set icon(icon: string) {
        if (!icon || this._icon === icon)
            return;

        this._icon = icon;
        if (GLib.file_test(icon, GLib.FileTest.EXISTS)) {
            this._file = true;
            this.set_from_pixbuf(
                GdkPixbuf.Pixbuf.new_from_file_at_size(
                    icon, this.size, this.size,
                ),
            );
        }
        else {
            this._file = false;
            this.icon_name = icon;
            this.pixel_size = this.size;
        }
    }

    vfunc_draw(cr: any): boolean {
        if (this._size > 1)
            return super.vfunc_draw(cr);

        const size = this.get_style_context()
            .get_property('font-size', Gtk.StateFlags.NORMAL) as number;

        if (size === this._previousSize)
            return super.vfunc_draw(cr);

        this._previousSize = size;

        if (this._file) {
            this.set_from_pixbuf(
                GdkPixbuf.Pixbuf.new_from_file_at_size(this.icon, size, size),
            );
        } else {
            this.pixel_size = size;
        }

        return super.vfunc_draw(cr);
    }
}
