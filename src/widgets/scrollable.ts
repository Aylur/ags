import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

const POLICY = {
    'automatic': Gtk.PolicyType.AUTOMATIC,
    'always': Gtk.PolicyType.ALWAYS,
    'never': Gtk.PolicyType.NEVER,
    'external': Gtk.PolicyType.EXTERNAL,
} as const;

type Policy = keyof typeof POLICY;

export type ScrollableProps<
    Child extends Gtk.Widget,
    Attr = unknown,
    Self = Scrollable<Child, Attr>,
> = BaseProps<Self, Gtk.ScrolledWindow.ConstructorProperties & {
    child?: Child
    hscroll?: Policy,
    vscroll?: Policy,
}, Attr>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Scrollable<Child, Attr> extends Widget<Attr> { }
export class Scrollable<Child extends Gtk.Widget, Attr> extends Gtk.ScrolledWindow {
    static {
        register(this, {
            properties: {
                'hscroll': ['string', 'rw'],
                'vscroll': ['string', 'rw'],
            },
        });
    }

    constructor(props: ScrollableProps<Child, Attr> = {}) {
        super({
            ...props as Gtk.ScrolledWindow.ConstructorProperties,
            hadjustment: new Gtk.Adjustment(),
            vadjustment: new Gtk.Adjustment(),
        });
    }

    get child() { return this.get_child() as Child; }

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

export default Scrollable;
