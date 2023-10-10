import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import AgsBox from './box.js';

export default class AgsCenterBox extends AgsBox {
    static {
        GObject.registerClass({
            GTypeName: 'AgsCenterBox',
            Properties: {
                'start-widget': GObject.ParamSpec.object(
                    'start-widget', 'Start Widget', 'Start Widget',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    Gtk.Widget.$gtype,
                ),
                'center-widget': GObject.ParamSpec.object(
                    'center-widget', 'Center Widget', 'Center Widget',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    Gtk.Widget.$gtype,
                ),
                'end-widget': GObject.ParamSpec.object(
                    'end-widget', 'End Widget', 'End Widget',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    Gtk.Widget.$gtype,
                ),
            },
        }, this);
    }

    set children(children: InstanceType<typeof Gtk.Widget>[] | null) {
        const newChildren = children || [];

        newChildren.filter(ch => !newChildren?.includes(ch))
            .forEach(ch => ch.destroy());

        if (newChildren[0])
            this.start_widget = newChildren[0];

        if (newChildren[1])
            this.center_widget = newChildren[1];

        if (newChildren[2])
            this.end_widget = newChildren[2];
    }

    // @ts-expect-error
    get start_widget() { return this._startWidget || null; }
    set start_widget(child: InstanceType<typeof Gtk.Widget> | null) {
        if (this.start_widget)
            this.start_widget.destroy();

        // @ts-expect-error
        this._startWidget = child;

        if (!child)
            return;

        this.pack_start(child, true, true, 0);
        this.notify('start-widget');
        this.show_all();
    }

    // @ts-expect-error
    get end_widget() { return this._endWidget || null; }
    set end_widget(child: InstanceType<typeof Gtk.Widget> | null) {
        if (this.end_widget)
            this.end_widget.destroy();

        // @ts-expect-error
        this._endWidget = child;

        if (!child)
            return;

        this.pack_end(child, true, true, 0);
        this.notify('end-widget');
        this.show_all();
    }

    get center_widget() { return this.get_center_widget(); }
    set center_widget(child: InstanceType<typeof Gtk.Widget> | null) {
        const center_widget = this.get_center_widget();
        if (!child && center_widget) {
            center_widget.destroy();
            return;
        }

        this.set_center_widget(child);
        this.notify('center-widget');
    }
}
