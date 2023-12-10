import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';

const POLICY = {
    'automatic': Gtk.PolicyType.AUTOMATIC,
    'always': Gtk.PolicyType.ALWAYS,
    'never': Gtk.PolicyType.NEVER,
    'external': Gtk.PolicyType.EXTERNAL,
} as const;

export type Policy = keyof typeof POLICY;

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

    setScroll(orientation: 'h' | 'v', scroll: Policy) {
        if (!scroll || this[`${orientation}scroll`] === scroll)
            return;

        if (!Object.keys(POLICY).includes(scroll)) {
            return console.error(Error(
                `${orientation}scroll has to be one of ${Object.keys(POLICY)}, but it is ${scroll}`,
            ));
        }

        this._set(`${orientation}scroll`, scroll);
        this._policy();
    }

    get hscroll() { return this._get('hscroll'); }
    set hscroll(hscroll: Policy) { this.setScroll('h', hscroll); }

    get vscroll() { return this._get('vscroll'); }
    set vscroll(vscroll: Policy) { this.setScroll('v', vscroll); }

    private _policy() {
        const hscroll = POLICY[this.hscroll];
        const vscroll = POLICY[this.vscroll];
        this.set_policy(
            hscroll === -1 ? Gtk.PolicyType.AUTOMATIC : hscroll,
            vscroll === -1 ? Gtk.PolicyType.AUTOMATIC : vscroll,
        );
    }
}
