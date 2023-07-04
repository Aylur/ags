import Gtk from 'gi://Gtk?version=3.0';
import { typecheck, error, warning } from './utils.js';
import * as Basic from './widgets.js';

interface ServiceAPI {
  instance: {
      connectWidget: (widget: Gtk.Widget, callback: (widget: Gtk.Widget, ...args: any[]) => void, event?: string) => void
  }
}

interface Widget {
  type: string|(() => Gtk.Widget)
  className?: string
  style?: string
  halign?: 'start'|'center'|'end'|'fill'
  valign?: 'start'|'center'|'end'|'fill'
  hexpand?: boolean
  vexpand?: boolean
  sensitive?: boolean
  tooltip?: string
  visible?: boolean
  connections?: ([string, (...args: any[]) => any] | [ServiceAPI, (...args: any[]) => any, string])[]
  properties?: [any, any][]
  setup?: (widget: Gtk.Widget) => void
}

const widgets: { [key: string]: (props: any) => Gtk.Widget } = {
    'box': Basic.Box,
    'button': Basic.Button,
    'centerbox': Basic.CenterBox,
    'dynamic': Basic.Dynamic,
    'entry': Basic.Entry,
    'eventbox': Basic.EventBox,
    'icon': Basic.Icon,
    'label': Basic.Label,
    'overlay': Basic.Overlay,
    'progressbar': Basic.ProgressBar,
    'revealer': Basic.Revealer,
    'scrollable': Basic.Scrollable,
    'slider': Basic.Slider,
};

function parseParams(widget: Gtk.Widget, {
    type, className, style, sensitive, tooltip,  connections, properties,
    halign = 'fill', valign = 'fill',
    hexpand = false, vexpand = false, visible = true, setup,
}: Widget) {
    type = type.toString();
    typecheck('className', className, ['string', 'undefined'], type);
    typecheck('style', style, ['string', 'undefined'], type);
    typecheck('sensitive', sensitive, ['boolean', 'undefined'], type);
    typecheck('tooltip', tooltip, ['string', 'undefined'], type);
    typecheck('halign', halign, 'string', type);
    typecheck('valign', valign, 'string', type);
    typecheck('hexpand', hexpand, 'boolean', type);
    typecheck('vexpand', vexpand, 'boolean', type);
    typecheck('visible', visible, 'boolean', type);

    if (className) {
        className.split(' ').forEach(cn => {
            widget.get_style_context().add_class(cn);
        });
    }

    try {
        // @ts-ignore
        widget.halign = Gtk.Align[halign.toUpperCase()];
        // @ts-ignore
        widget.valign = Gtk.Align[valign.toUpperCase()];
    } catch (err) {
        warning('wrong align value');
    }

    widget.hexpand = hexpand;
    widget.vexpand = vexpand;

    if (sensitive !== undefined)
        widget.sensitive = sensitive;

    if (tooltip)
        widget.set_tooltip_text(tooltip);

    // @ts-ignore
    widget.setStyle = (css: string) => {
        const provider = new Gtk.CssProvider();
        provider.load_from_data(`* { ${css} }`);
        widget.reset_style();
        widget.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    };

    // @ts-ignore
    widget.toggleClassName = (className: string, condition = true) => {
        condition
            ? widget.get_style_context().add_class(className)
            : widget.get_style_context().remove_class(className);
    };

    if (style)
        // @ts-ignore
        widget.setStyle(style);

    if (!visible)
        widget.hide();

    if (properties) {
        properties.forEach(([key, value]) => {
            // @ts-ignore
            widget[`_${key}`] = value;
        });
    }

    if (setup)
        setup(widget);

    if (connections) {
        connections.forEach(([s, callback, event]) => {
            if (typeof s === 'string')
                widget.connect(s, callback);

            else
                s.instance.connectWidget(widget, callback, event);
        });
    }
}

export default function Widget(params: null|Widget|string|(() => Gtk.Widget)|Gtk.Widget ): Gtk.Widget {
    if (!params) {
        error('Widget from null');
        return new Gtk.Label({ label: `Null error on ${params}` });
    }

    if (typeof params === 'string')
        return new Gtk.Label({ label: params });

    if (typeof params === 'function')
        return params();

    if (params instanceof Gtk.Widget)
        return params;

    const {
        type, className, style, halign, valign, connections, properties,
        hexpand, vexpand, sensitive, tooltip, visible, setup,
        ...props
    }: Widget = params;

    let widget: Gtk.Widget|null = null;
    if (typeof type === 'function')
        widget = type();

    if (typeof type === 'string' && type in widgets)
        widget = widgets[type]({ type, ...props });

    if (widget === null) {
        error(`There is no widget with type ${type}`);
        return new Gtk.Label({ label: `${type} doesn't exist` });
    }

    parseParams(widget, {
        type, className, style, halign, valign, connections, properties,
        hexpand, vexpand, sensitive, tooltip, visible, setup,
    });

    return widget;
}

Widget.widgets = widgets;
