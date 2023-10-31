import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

const policy = ['automatic', 'always', 'never', 'external'] as const;
type Policy = typeof policy[number]

export interface ScrollableProps extends
    BaseProps<AgsScrollable>, Gtk.ScrolledWindow.ConstructorProperties {
    hscroll?: Policy,
    vscroll?: Policy,
}

export default class AgsScrollable extends AgsWidget(Gtk.ScrolledWindow) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsScrollable',
            Properties: {
                'hscroll': Service.pspec('hscroll', 'string', 'rw'),
                'vscroll': Service.pspec('vscroll', 'string', 'rw'),
            },
        }, this);
    }

    constructor(props: ScrollableProps = {}) {
        super({
            ...props,
            hadjustment: new Gtk.Adjustment(),
            vadjustment: new Gtk.Adjustment(),
        });
    }

    get hscroll() { return this._get('hscroll'); }
    set hscroll(hscroll: Policy) {
        if (!hscroll || this.hscroll === hscroll)
            return;

        if (!policy.includes(hscroll)) {
            console.error('wrong hscroll value for Scrollable');
            return;
        }

        this._set('hscroll', hscroll);
        this._policy();
    }

    get vscroll() { return this._get('vscroll'); }
    set vscroll(vscroll: Policy) {
        if (!vscroll || this.vscroll === vscroll)
            return;

        if (!policy.includes(vscroll)) {
            console.error('wrong vscroll value for Scrollable');
            return;
        }

        this._set('vscroll', vscroll);
        this._policy();
    }

    private _policy() {
        const hscroll = policy.findIndex(p => p === this.hscroll);
        const vscroll = policy.findIndex(p => p === this.vscroll);
        this.set_policy(
            hscroll === -1 ? Gtk.PolicyType.AUTOMATIC : hscroll,
            vscroll === -1 ? Gtk.PolicyType.AUTOMATIC : vscroll,
        );
    }
}
