import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import type GtkTypes from "../../types/gtk-types/gtk-3.0"
import Service from '../service.js';

const policy = ['automatic', 'always', 'never', 'external'] as const;
type Policy = typeof policy[number];

function policyToEnum(policy: Policy) {
    switch (policy) {
        case 'automatic': return Gtk.PolicyType.AUTOMATIC;
        case 'always': return Gtk.PolicyType.ALWAYS;
        case 'never': return Gtk.PolicyType.NEVER;
        case 'external': return Gtk.PolicyType.EXTERNAL;
    }
}

export interface ScrollableProps extends GtkTypes.ScrolledWindow.ConstructorProperties {
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

    // @ts-expect-error custom overrides
    get hscroll() { return this._hscroll as Policy; }
    set hscroll(hscroll: Policy) {
        if (!hscroll || this.hscroll === hscroll)
            return;

        if (!policy.includes(hscroll)) {
            console.error('wrong hscroll value for Scrollable');
            return;
        }

        // @ts-expect-error custom overrides
        this._hscroll = hscroll;
        this.notify('hscroll');
        this.policy();
    }

    // @ts-expect-error custom overrides
    get vscroll() { return this._vscroll as Policy; }
    set vscroll(vscroll: Policy) {
        if (!vscroll || this.vscroll === vscroll)
            return;

        if (!policy.includes(vscroll)) {
            console.error('wrong vscroll value for Scrollable');
            return;
        }

        // @ts-expect-error custom overrides
        this._vscroll = vscroll;
        this.notify('vscroll');
        this.policy();
    }

    policy() {
        const hscroll = policyToEnum(this.hscroll);
        const vscroll = policyToEnum(this.vscroll);
        this.set_policy(
            hscroll,
            vscroll,
        );
    }
}
