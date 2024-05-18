import Gtk from 'gi://Gtk?version=3.0';
import { register, type BaseProps, type Widget } from './widget.js';

export type CenterBoxProps<
    StartWidget extends Gtk.Widget = Gtk.Widget,
    CenterWidget extends Gtk.Widget = Gtk.Widget,
    EndWidget extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = CenterBox<StartWidget, CenterWidget, EndWidget, Attr>,
> = BaseProps<Self, Gtk.Box.ConstructorProperties & {
    vertical?: boolean
    children?: [StartWidget?, CenterWidget?, EndWidget?],
    start_widget?: StartWidget
    center_widget?: CenterWidget
    end_widget?: EndWidget
}, Attr>;

export function newCenterBox<
    StartWidget extends Gtk.Widget = Gtk.Widget,
    CenterWidget extends Gtk.Widget = Gtk.Widget,
    EndWidget extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof CenterBox<StartWidget, CenterWidget, EndWidget, Attr>>) {
    return new CenterBox(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CenterBox<StartWidget, CenterWidget, EndWidget, Attr> extends Widget<Attr> { }
export class CenterBox<
    StartWidget extends Gtk.Widget,
    CenterWidget extends Gtk.Widget,
    EndWidget extends Gtk.Widget,
    Attr
> extends Gtk.Box {
    static {
        register(this, {
            properties: {
                'vertical': ['boolean', 'rw'],
                'children': ['boolean', 'rw'],
                'start-widget': ['widget', 'rw'],
                'center-widget': ['widget', 'rw'],
                'end-widget': ['widget', 'rw'],
            },
        });
    }

    constructor(
        props: CenterBoxProps<StartWidget, CenterWidget, EndWidget, Attr> = {},
        startWidget?: StartWidget,
        centerWidget?: CenterWidget,
        endWidget?: EndWidget,
    ) {
        if (startWidget)
            props.start_widget = startWidget;

        if (centerWidget)
            props.center_widget = centerWidget;

        if (endWidget)
            props.end_widget = endWidget;

        super(props as Gtk.Widget.ConstructorProperties);
    }

    get children() { return [this.start_widget, this.center_widget, this.end_widget]; }
    set children(children: [StartWidget | null, CenterWidget | null, EndWidget | null]) {
        const newChildren = children || [];

        newChildren.filter(ch => !newChildren?.includes(ch))
            .forEach(ch => ch && ch.destroy());

        if (children[0])
            this.start_widget = children[0];

        if (children[1])
            this.center_widget = children[1];

        if (children[2])
            this.end_widget = children[2];
    }

    get start_widget() { return this._get('start-widget') || null as StartWidget | null; }
    set start_widget(child: StartWidget | null) {
        if (this.start_widget)
            this.start_widget.destroy();

        this._set('start-widget', child);

        if (!child)
            return;

        this.pack_start(child, true, true, 0);
        this.show_all();
    }

    get end_widget() { return this._get('end-widget') || null as EndWidget | null; }
    set end_widget(child: EndWidget | null) {
        if (this.end_widget)
            this.end_widget.destroy();

        this._set('end-widget', child);

        if (!child)
            return;

        this.pack_end(child, true, true, 0);
        this.show_all();
    }

    get center_widget() { return this.get_center_widget() as CenterWidget | null; }
    set center_widget(child: CenterWidget | null) {
        const center_widget = this.get_center_widget();
        if (!child && center_widget) {
            center_widget.destroy();
            return;
        }

        this.set_center_widget(child);
        this.notify('center-widget');
    }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(vertical: boolean) {
        if (this.vertical === vertical)
            return;

        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;

        this.notify('vertical');
    }
}

export default CenterBox;
