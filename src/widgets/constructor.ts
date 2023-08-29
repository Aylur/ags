import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';
import { connect, interval } from '../utils.js';
import Service from '../service/service.js';

export type Command = string | ((...args: unknown[]) => boolean);

type ConnectWidget = (
    widget: Gtk.Widget,
    callback: (widget: Gtk.Widget, ...args: unknown[]) => void,
    event?: string
) => void

interface Connectable extends GObject.Object {
    instance: { connectWidget: ConnectWidget }
    connectWidget: ConnectWidget
}

interface CommonParams {
    className?: string
    style?: string
    halign?: 'start' | 'center' | 'end' | 'fill'
    valign?: 'start' | 'center' | 'end' | 'fill'
    connections?: (
        [string, (...args: unknown[]) => unknown] |
        [number, (...args: unknown[]) => unknown] |
        [Connectable, (...args: unknown[]) => unknown, string]
    )[]
    properties?: [prop: string, value: unknown][]
    binds?: [prop: string, obj: Connectable, objProp?: string, signal?: string][],
    setup?: (widget: Gtk.Widget) => void
}

function separateCommon({
    className, style, halign, valign, connections, properties, binds, setup,
    ...rest
}: CommonParams) {
    return [
        { className, style, halign, valign, connections, properties, binds, setup },
        rest,
    ];
}

function parseCommon(widget: Gtk.Widget, {
    className, style,
    halign, valign,
    connections = [], properties, binds, setup,
}: CommonParams) {
    if (className !== undefined)
        // @ts-expect-error
        widget.className = className;

    if (style !== undefined)
        // @ts-expect-error
        widget.style = style;


    if (typeof halign === 'string') {
        // @ts-expect-error
        const align = Gtk.Align[halign.toUpperCase()];
        if (typeof align !== 'number')
            console.error('wrong halign value');

        widget.halign = align;
    }

    if (typeof halign === 'number')
        widget.halign = halign;

    if (typeof valign === 'string') {
        // @ts-expect-error
        const align = Gtk.Align[valign.toUpperCase()];
        if (typeof align !== 'number')
            console.error('wrong valign value');

        widget.valign = align;
    }

    if (typeof valign === 'number')
        widget.valign = valign;

    if (properties) {
        properties.forEach(([key, value]) => {
            // @ts-expect-error
            widget[`_${key}`] = value;
        });
    }

    if (binds) {
        binds.forEach(([prop, obj, value = 'value', signal = 'changed']) => {
            if (!prop || !obj) {
                logError(new Error('missing arguments to connections'));
                return;
            }

            const callback = () => {
                // @ts-expect-error
                widget[prop] = obj[value];
            };
            connections.push([obj, callback, signal]);
        });
    }

    if (connections) {
        connections.forEach(([s, callback, event]) => {
            if (!s || !callback) {
                logError(new Error('missing arguments to connections'));
                return;
            }

            if (typeof s === 'string')
                widget.connect(s, callback);

            else if (typeof s === 'number')
                interval(s, () => callback(widget), widget);
            else if (s instanceof Service)
                s.connectWidget(widget, callback, event);
            else if (typeof s?.instance?.connectWidget === 'function')
                s.instance.connectWidget(widget, callback, event);

            else if (typeof s?.connectWidget === 'function')
                s.connectWidget(widget, callback, event);

            else if (typeof s?.connect === 'function')
                connect(s, widget, callback, event);

            else
                logError(new Error(`${s} is not connectable`));
        });
    }

    if (typeof setup === 'function')
        setup(widget);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ctor = { new(...args: any[]): Gtk.Widget }
export function constructor(
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
