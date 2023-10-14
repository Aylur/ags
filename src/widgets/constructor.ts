import Gtk from 'gi://Gtk?version=3.0';
import GObject from 'gi://GObject';
import { connect, interval } from '../utils.js';

export type Command = string | ((...args: unknown[]) => boolean);

export interface CommonParams<T extends InstanceType<typeof Gtk.Widget>> {
    className?: string
    style?: string
    css?: string
    halign?: 'start' | 'center' | 'end' | 'fill'
    valign?: 'start' | 'center' | 'end' | 'fill'
    connections?: (
        [string, (widget: T) => unknown] |
        [number, (widget: T) => unknown] |
        [InstanceType<typeof GObject.Object> & { connectWidget: unknown }, (widget: T, ...args: unknown[]) => unknown, string]
    )[]
    properties?: [prop: string, value: unknown][]
    binds?: [
        prop: string,
        obj: InstanceType<typeof GObject.Object> & { connectWidget: unknown },
        objProp?: string,
        transform?: (value: unknown) => unknown][],
    setup?: (widget: T) => void
}

function separateCommon<
Output extends InstanceType<typeof Gtk.Widget>,
T extends CommonParams<Output>
>({
    className, style, css, halign, valign, connections, properties, binds, setup,
    ...rest
}: T): [
    CommonParams<Output>,
    Omit<T, keyof CommonParams<Output>>
] {
    return [
        { className, style, css, halign, valign, connections, properties, binds, setup },
        rest,
    ];
}

function parseCommon<T extends InstanceType<typeof Gtk.Widget>>(widget: T, {
    className, style, css,
    halign, valign,
    connections = [], properties, binds, setup,
}: CommonParams<T>) {
    if (className !== undefined)
        // @ts-expect-error
        widget.className = className;

    if (style !== undefined)
        // @ts-expect-error
        widget.style = style;

    if (css !== undefined)
        // @ts-expect-error
        widget.css = css;


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
        binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
            if (!prop || !obj) {
                console.error(Error('missing arguments to binds'));
                return;
            }

            // @ts-expect-error
            const callback = () => widget[prop] = transform(obj[objProp]);
            connections.push([obj, callback, `notify::${objProp}`]);
        });
    }

    if (connections) {
        connections.forEach(([s, callback, event]) => {
            if (!s || !callback) {
                console.error(Error('missing arguments to connections'));
                return;
            }

            if (typeof s === 'string')
                widget.connect(s, callback);

            else if (typeof s === 'number')
                interval(s, () => callback(widget), widget);

            else if (typeof s?.connectWidget === 'function')
                s.connectWidget(widget, callback, event);

            else if (typeof s?.connect === 'function')
                connect(s, widget, callback, event);

            else
                console.error(Error(`${s} is not connectable`));
        });
    }

    if (typeof setup === 'function')
        setup(widget);
}

export function constructor<
    Output extends InstanceType<typeof Gtk.Widget>,
    Params extends CommonParams<Output> | ConstructorParameters<Class>[0],
    Class extends new (arg: Omit<Params, keyof CommonParams<Output>>) => InstanceType<Class> & Output,
>(
    ctor: Class,
    params: Params,
): InstanceType<Class> {
    if (typeof params === 'string') {
        return new ctor(params);
    }

    const [common, rest] = separateCommon<Output, Params>(params);

    const widget = new ctor(rest);
    parseCommon(widget, common);

    return widget;
}
