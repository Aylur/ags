import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

type Policy = 'automatic' | 'always' | 'never' | 'external';
const policy = ['automatic', 'always', 'never', 'external'];

export interface ScrollableProps extends Gtk.ScrolledWindow.ConstructorProperties {
    hscroll?: Policy,
    vscroll?: Policy,
}

export default class AgsScrollable extends Gtk.ScrolledWindow {
    static {
        GObject.registerClass({
            Properties: {
                'hscroll': Service.pspec('hscroll', 'string', 'rw'),
                'vscroll': Service.pspec('vscroll', 'string', 'rw'),
            },
        }, this);
    }

    constructor(params: ScrollableProps = {}) {
        super({
            ...params,
            hadjustment: new Gtk.Adjustment(),
            vadjustment: new Gtk.Adjustment(),
        });
    }

    // @ts-expect-error
    get hscroll() { return this._hscroll as Policy; }
    set hscroll(hscroll: Policy) {
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
    get vscroll() { return this._vscroll as Policy; }
    set vscroll(vscroll: Policy) {
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
        const hscroll = policy.findIndex(p => p === this.hscroll);
        const vscroll = policy.findIndex(p => p === this.vscroll);
        this.set_policy(
            hscroll === -1 ? Gtk.PolicyType.AUTOMATIC : hscroll,
            vscroll === -1 ? Gtk.PolicyType.AUTOMATIC : vscroll,
        );
    }
}
