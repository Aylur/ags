import Gtk from 'gi://Gtk?version=3.0';
import { interval } from '../utils.js';

export type Command = string | ((...args: any[]) => boolean);

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
    if (className !== undefined)
        // @ts-ignore
        widget.className = className;

    if (style !== undefined)
        // @ts-ignore
        widget.style = style;


    if (typeof halign === 'string') {
        // @ts-ignore
        const align = Gtk.Align[halign.toUpperCase()];
        if (typeof align !== 'number')
            console.error('wrong halign value');

        widget.halign = align;
    }

    if (typeof halign === 'number')
        widget.halign = halign;

    if (typeof valign === 'string') {
        // @ts-ignore
        const align = Gtk.Align[valign.toUpperCase()];
        if (typeof align !== 'number')
            console.error('wrong valign value');

        widget.valign = align;
    }

    if (typeof valign === 'number')
        widget.valign = valign;

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

            else if (typeof s?.instance?.connectWidget === 'function')
                s.instance.connectWidget(widget, callback, event);

            else
                logError(new Error(`${s} is not an instanceof Service`));
        });
    }

    if (typeof setup === 'function')
        setup(widget);
}

export type ctor = { new(...args: any[]): Gtk.Widget }
export default function constructor(
    ctor: ctor,
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
