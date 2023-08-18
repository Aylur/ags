import Gtk from 'gi://Gtk?version=3.0';
import { interval } from '../utils.js';

interface ServiceAPI {
    instance: {
        connectWidget: (
            widget: Gtk.Widget,
            callback: (widget: Gtk.Widget, ...args: any[]) => void,
            event?: string
        ) => void
    }
}

interface CommonParams {
    className?: string
    style?: string
    halign?: 'start' | 'center' | 'end' | 'fill'
    valign?: 'start' | 'center' | 'end' | 'fill'
    connections?: (
        [string, (...args: any[]) => any] |
        [number, (...args: any[]) => any] |
        [ServiceAPI, (...args: any[]) => any, string]
    )[]
    properties?: [any, any][]
    setup?: (widget: Gtk.Widget) => void
}

const widgetProviders: Map<Gtk.Widget, Gtk.CssProvider> = new Map();
function setStyle(widget: Gtk.Widget, css: string) {
    const previous = widgetProviders.get(widget);
    if (previous)
        widget.get_style_context().remove_provider(previous);

    const provider = new Gtk.CssProvider();
    const style = `* { ${css} }`;
    provider.load_from_data(style);
    widget.get_style_context()
        .add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    widgetProviders.set(widget, provider);
}

function toggleClassName(
    widget: Gtk.Widget,
    className: string,
    condition = true,
) {
    condition
        ? widget.get_style_context().add_class(className)
        : widget.get_style_context().remove_class(className);
}

function separateCommon({
    className, style, halign, valign, connections, properties, setup,
    ...rest
}: CommonParams) {
    return [
        { className, style, halign, valign, connections, properties, setup },
        rest,
    ];
}

function parseCommon(widget: Gtk.Widget, {
    className, style,
    halign, valign,
    connections, properties, setup,
}: CommonParams) {
    // @ts-ignore
    widget.setStyle = (css: string) => setStyle(widget, css);

    // @ts-ignore
    widget.toggleClassName = (className: string, condition = true) =>
        toggleClassName(widget, className, condition);

    if (typeof className === 'string') {
        className.split(' ').forEach(cn => {
            widget.get_style_context().add_class(cn);
        });
    }

    if (typeof halign === 'string') {
        // @ts-ignore
        const align = Gtk.Align[halign.toUpperCase()];
        if (typeof align !== 'number')
            console.error('wrong halign value');
        widget.halign = align;
    }

    if (typeof valign === 'string') {
        // @ts-ignore
        const align = Gtk.Align[valign.toUpperCase()];
        if (typeof align !== 'number')
            console.error('wrong valign value');
        widget.valign = align;
    }

    if (typeof style === 'string')
        setStyle(widget, style);

    if (properties) {
        properties.forEach(([key, value]) => {
            // @ts-ignore
            widget[`_${key}`] = value;
        });
    }

    if (connections) {
        connections.forEach(([s, callback, event]) => {
            if (typeof s === 'string')
                widget.connect(s, callback);

            else if (typeof s === 'number')
                interval(s, () => callback(widget), widget);

            else
                s.instance.connectWidget(widget, callback, event);
        });
    }

    if (typeof setup === 'function')
        setup(widget);
}

export default function constructor(
    ctor: { new(...args: any[]): Gtk.Widget },
    params: CommonParams | string = {},
) {
    let widget;
    if (typeof params === 'string') {
        widget = new ctor(params);
    } else {
        const [common, rest] = separateCommon(params);
        widget = new ctor(rest);
        parseCommon(widget, common);
    }
    return widget;
}
