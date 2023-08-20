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

function toggleClassName(
    widget: Gtk.Widget,
    className: string,
    condition = true,
) {
    condition
        ? widget.get_style_context().add_class(className)
        : widget.get_style_context().remove_class(className);
}

Object.defineProperty(Gtk.Widget.prototype, 'className', {
    get: function() {
        return this._className || [];
    },
    set: function(names) {
        if (!Array.isArray(names) && typeof names !== 'string') {
            console.error('className has to be a string or array');
            return;
        }

        this._className = [];
        if (typeof names === 'string')
            names = names.split(/\s+/);

        for (const cn of names) {
            toggleClassName(this, cn);
            this._className.push(cn);
        }
    },
});

const widgetProviders: Map<Gtk.Widget, Gtk.CssProvider> = new Map();
function setStyle(widget: Gtk.Widget, css: string) {
    if (typeof css !== 'string') {
        console.error('style has to be a string');
        return false;
    }

    const previous = widgetProviders.get(widget);
    if (previous)
        widget.get_style_context().remove_provider(previous);

    const provider = new Gtk.CssProvider();
    widgetProviders.set(widget, provider);
    provider.load_from_data(`* { ${css} }`);
    widget.get_style_context()
        .add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
}

Object.defineProperty(Gtk.Widget.prototype, 'style', {
    get: function() {
        return this._style || '';
    },
    set: function(css) {
        if (!setStyle(this, css))
            return;

        this._style = css;
    },
});

// @ts-ignore
Gtk.Widget.prototype.setStyle = function(css: string) {
    setStyle(this, css);
};

// @ts-ignore
Gtk.Widget.prototype.toggleClassName = function(cn: string, condition = true) {
    toggleClassName(this, cn, condition);
};

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
