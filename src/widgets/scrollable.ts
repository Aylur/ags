import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

const policy = ['automatic', 'always', 'never', 'external'];

export default class AgsScrollable extends Gtk.ScrolledWindow {
    static {
        GObject.registerClass({
            GTypeName: 'AgsScrollable',
            Properties: {
                'hscroll': GObject.ParamSpec.string(
                    'hscroll', 'HScroll', 'Horizontal Scroll Policy',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    'automatic',
                ),
                'vscroll': GObject.ParamSpec.string(
                    'vscroll', 'VScroll', 'Vertical Scroll Policy',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    'automatic',
                ),
            },
        }, this);
    }

    constructor(params: object) {
        super({
            ...params,
            hadjustment: new Gtk.Adjustment(),
            vadjustment: new Gtk.Adjustment(),
        });
    }

    // @ts-ignore
    get child() { return this.get_child(); }
    set child(child: Gtk.Widget) {
        const widget = this.get_child();
        if (widget === child)
            return;

        if (widget)
            widget.destroy();

        if (child)
            this.add(child);
    }

    _hscroll = 'automatic';
    get hscroll() { return this._hscroll; }
    set hscroll(hscroll: string) {
        if (!hscroll)
            return;

        if (!policy.includes(hscroll)) {
            console.error('wrong hscroll value for Scrollable');
            return;
        }

        this._hscroll = hscroll;
        this.policy();
    }

    _vscroll = 'automatic';
    get vscroll() { return this._vscroll; }
    set vscroll(vscroll: string) {
        if (!vscroll)
            return;

        if (!policy.includes(vscroll)) {
            console.error('wrong vscroll value for Scrollable');
            return;
        }

        this._vscroll = vscroll;
        this.policy();
    }

    policy() {
        this.set_policy(
            // @ts-ignore
            Gtk.PolicyType[this._hscroll?.toUpperCase() || 'AUTOMATIC'],
            // @ts-ignore
            Gtk.PolicyType[this._vscroll?.toUpperCase() || 'AUTOMATIC'],
        );
    }
}
