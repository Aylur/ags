import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { Box } from './box.js';

class CenterBox extends Box {
    static {
        GObject.registerClass({
            GTypeName: 'AgsCenterBox',
            Properties: {
                'start-widget': GObject.ParamSpec.object(
                    'start-widget', 'Start Widget', 'Start Widget',
                    GObject.ParamFlags.READWRITE,
                    GObject.Object.$gtype,
                ),
                'center-widget': GObject.ParamSpec.object(
                    'center-widget', 'Center Widget', 'Center Widget',
                    GObject.ParamFlags.READWRITE,
                    GObject.Object.$gtype,
                ),
                'end-widget': GObject.ParamSpec.object(
                    'end-widget', 'End Widget', 'End Widget',
                    GObject.ParamFlags.READWRITE,
                    GObject.Object.$gtype,
                ),
            },
        }, this);
    }

    _start_widget!: Gtk.Widget | null;
    _end_widget!: Gtk.Widget | null;

    get start_widget() { return this._start_widget || null; }
    set start_widget(child: Gtk.Widget | null) {
        if (this._start_widget)
            this.remove(this._start_widget);

        if (!child) {
            this._start_widget = null;
            return;
        }

        this._start_widget = child;
        this.pack_start(child, true, true, 0);
        print('packed');
    }

    get center_widget() { return this.get_center_widget(); }
    set center_widget(child: Gtk.Widget | null) {
        const center_widget = this.get_center_widget();
        if (!child && center_widget) {
            this.remove(center_widget);
            return;
        }

        this.set_center_widget(child);
    }

    get end_widget() { return this._end_widget || null; }
    set end_widget(child: Gtk.Widget | null) {
        if (this._end_widget)
            this.remove(this._end_widget);

        if (!child) {
            this._end_widget = null;
            return;
        }

        this._end_widget = child;
        this.pack_end(child, true, true, 0);
    }
}

export default (params: object) => new CenterBox(params);
