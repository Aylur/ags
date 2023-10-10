import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service/service.js';

const policy = ['automatic', 'always', 'never', 'external'];

export default class AgsScrollable extends Gtk.ScrolledWindow {
    static {
        GObject.registerClass({
            GTypeName: 'AgsScrollable',
            Properties: {
                'hscroll': Service.pspec('hscroll', 'string', 'rw'),
                'vscroll': Service.pspec('vscroll', 'string', 'rw'),
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

    // @ts-expect-error
    get hscroll() { return this._hscroll; }
    set hscroll(hscroll: string) {
        if (!hscroll || this.hscroll === hscroll)
            return;

        if (!policy.includes(hscroll)) {
            console.error('wrong hscroll value for Scrollable');
            return;
        }

        // @ts-expect-error
        this._hscroll = hscroll;
        this.notify('hscroll');
        this.policy();
    }

    // @ts-expect-error
    get vscroll() { return this._vscroll; }
    set vscroll(vscroll: string) {
        if (!vscroll || this.vscroll === vscroll)
            return;

        if (!policy.includes(vscroll)) {
            console.error('wrong vscroll value for Scrollable');
            return;
        }

        // @ts-expect-error
        this._vscroll = vscroll;
        this.notify('vscroll');
        this.policy();
    }

    policy() {
        this.set_policy(
            // @ts-expect-error
            Gtk.PolicyType[this.hscroll?.toUpperCase() || 'AUTOMATIC'],
            // @ts-expect-error
            Gtk.PolicyType[this.vscroll?.toUpperCase() || 'AUTOMATIC'],
        );
    }
}
