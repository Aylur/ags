import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib?version=2.0';
import Gdk from 'gi://Gdk?version=3.0';
import Cairo from 'gi://cairo?version=1.0';
import Service, { Props, BindableProps, Binding } from '../service.js';
import { registerGObject, kebabify } from '../utils/gobject.js';
import { interval, idle } from '../utils.js';
import { Variable } from '../variable.js';
import { App } from '../app.js';

let warned = false;
function deprecated() {
    if (warned)
        return;

    console.warn(Error('Using "connections" and "binds" props are DEPRECATED\n' +
        'Use .hook() .bind() .poll() .on() instead, refer to the wiki to see examples'));
    warned = true;
}

const ALIGN = {
    'fill': Gtk.Align.FILL,
    'start': Gtk.Align.START,
    'end': Gtk.Align.END,
    'center': Gtk.Align.CENTER,
    'baseline': Gtk.Align.BASELINE,
} as const;

export type Align = keyof typeof ALIGN;

export type Cursor =
    | 'default'
    | 'help'
    | 'pointer'
    | 'context-menu'
    | 'progress'
    | 'wait'
    | 'cell'
    | 'crosshair'
    | 'text'
    | 'vertical-text'
    | 'alias'
    | 'copy'
    | 'no-drop'
    | 'move'
    | 'not-allowed'
    | 'grab'
    | 'grabbing'
    | 'all-scroll'
    | 'col-resize'
    | 'row-resize'
    | 'n-resize'
    | 'e-resize'
    | 's-resize'
    | 'w-resize'
    | 'ne-resize'
    | 'nw-resize'
    | 'sw-resize'
    | 'se-resize'
    | 'ew-resize'
    | 'ns-resize'
    | 'nesw-resize'
    | 'nwse-resize'
    | 'zoom-in'
    | 'zoom-out'

type Property = [prop: string, value: unknown];

type Connection<Self> =
    | [GObject.Object, (self: Self, ...args: unknown[]) => unknown, string?]
    | [string, (self: Self, ...args: unknown[]) => unknown]
    | [number, (self: Self, ...args: unknown[]) => unknown];

type Bind = [
    prop: string,
    obj: GObject.Object,
    objProp?: string,
    transform?: (value: any) => any,
];

export interface CommonProps<Attr> {
    class_name?: string
    class_names?: Array<string>
    click_through?: boolean
    css?: string
    hpack?: Align
    vpack?: Align
    cursor?: Cursor
    attribute?: Attr
}

export type BaseProps<Self, Props, Attr = unknown> = {
    setup?: (self: Self) => void
} & BindableProps<Props & CommonProps<Attr>>

export interface Widget<Attr> extends CommonProps<Attr> {
    hook<
        Gobject extends GObject.Object,
    >(
        gobject: Gobject | App,
        callback: (self: this, ...args: any[]) => void,
        signal?: string,
    ): this

    bind<
        Prop extends keyof Props<this>,
        Gobject extends GObject.Object,
        ObjProp extends keyof Props<Gobject>,
    >(
        prop: Prop,
        gobject: Gobject,
        objProp?: ObjProp,
        transform?: (value: Gobject[ObjProp]) => this[Prop],
    ): this

    on(
        signal: string,
        callback: (self: this, ...args: any[]) => void
    ): this

    poll(
        timeout: number,
        callback: (self: this) => void,
    ): this

    readonly is_destroyed: boolean
    _handleParamProp(prop: keyof this, value: any): void
    _get<T>(field: string): T;
    _set<T>(field: string, value: T, notify?: boolean): void

    toggleClassName(className: string, condition?: boolean): void
    setCss(css: string): void
    isHovered(event?: Gdk.Event): boolean
}

export class AgsWidget<Attr> extends Gtk.Widget implements Widget<Attr> {
    set attribute(attr: Attr) { this._set('attribute', attr); }
    get attribute(): Attr { return this._get('attribute'); }

    hook<
        Gobject extends GObject.Object,
    >(
        gobject: Gobject | App,
        callback: (self: this, ...args: any[]) => void,
        signal?: string,
    ): this {
        if (!(gobject instanceof GObject.Object)) {
            console.error(Error(`${gobject} is not a GObject`));
            return this;
        }

        if (!(gobject instanceof Service ||
            gobject instanceof App ||
            gobject instanceof Variable) &&
            !signal) {
            console.error(Error('you are trying to connect to a regular GObject ' +
                'without specifying the signal'));
            return this;
        }

        const id = gobject.connect(signal!, (_, ...args: unknown[]) => {
            callback(this, ...args);
        });

        this.connect('destroy', () => {
            gobject.disconnect(id);
        });

        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            if (!this.is_destroyed)
                callback(this);

            return GLib.SOURCE_REMOVE;
        });

        return this;
    }

    bind<
        Prop extends keyof Props<this>,
        Gobject extends GObject.Object,
        ObjProp extends keyof Props<Gobject>,
    >(
        prop: Prop,
        gobject: Gobject,
        objProp?: ObjProp,
        transform?: (value: Gobject[ObjProp]) => this[Prop],
    ): this {
        const targetProp = objProp || 'value';
        const callback = transform
            ? () => {
                // @ts-expect-error too lazy to type
                this[prop] = transform(gobject[targetProp]);
            }
            : () => {
                // @ts-expect-error too lazy to type
                this[prop] = gobject[targetProp];
            };

        this.hook(gobject, callback, `notify::${kebabify(targetProp)}`);
        return this;
    }

    on(
        signal: string,
        callback: (self: this, ...args: any[]) => void,
    ): this {
        this.connect(signal, callback);
        return this;
    }

    poll(
        timeout: number,
        callback: (self: this) => void,
    ): this {
        callback(this);
        interval(timeout, () => callback(this), this);
        return this;
    }

    _init(config: BaseProps<this, Gtk.Widget.ConstructorProperties, Attr> = {}) {
        const { setup, attribute, ...props } = config;

        const binds = (Object.keys(props) as Array<keyof typeof props>)
            .map(prop => {
                if (props[prop] instanceof Binding) {
                    const bind = [prop, props[prop]];
                    delete props[prop];
                    return bind;
                }
            })
            .filter(pair => pair);

        super._init(props as Gtk.Widget.ConstructorProperties);

        if (attribute)
            this._set('attribute', attribute);

        (binds as unknown as Array<[keyof Props<this>, Binding<any, any, any>]>)
            .forEach(([selfProp, { emitter, prop, transformFn }]) => {
                this.bind(selfProp, emitter, prop, transformFn);
            });

        this.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK);
        this.add_events(Gdk.EventMask.LEAVE_NOTIFY_MASK);

        this.connect('enter-notify-event', this._updateCursor.bind(this));
        this.connect('leave-notify-event', this._updateCursor.bind(this));
        this.connect('destroy', () => this._set('is-destroyed', true));

        idle(() => {
            if (this.click_through)
                this.input_shape_combine_region(new Cairo.Region);
        });

        if (setup)
            setup(this);
    }

    _handleParamProp<Props>(prop: keyof Props, value: any) {
        if (value === undefined)
            return;

        if (value instanceof Binding)
            // @ts-expect-error implementation in Connectable
            this.bind(prop, value.emitter, value.prop, value.transformFn);
        else
            this[prop as keyof this] = value;
    }

    get is_destroyed(): boolean { return this._get('is-destroyed') || false; }

    // defining private fields for typescript causes
    // gobject constructor field setters to be overridden
    // so we use this _get and _set to avoid @ts-expect-error everywhere
    _get<T>(field: string) {
        return (this as unknown as { [key: string]: unknown })[`__${field}`] as T;
    }

    _set<T>(field: string, value: T, notify = true) {
        if (this._get(field) === value)
            return;

        (this as unknown as { [key: string]: T })[`__${field}`] = value;

        if (notify)
            this.notify(field);
    }

    // FIXME: deprecated
    set connections(connections: Connection<this>[]) {
        if (!connections)
            return;

        deprecated();
        connections.forEach(([s, callback, event]) => {
            if (s === undefined || callback === undefined)
                return console.error(Error('missing arguments to connections'));

            if (typeof s === 'string')
                this.connect(s, callback);

            else if (typeof s === 'number')
                interval(s, () => callback(this), this);

            else if (s instanceof GObject.Object)
                this.hook(s, callback, event);

            else
                console.error(Error(`${s} is not a GObject | string | number`));
        });
    }

    // FIXME: deprecated
    set binds(binds: Bind[]) {
        if (!binds)
            return;

        deprecated();
        binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
            // @ts-expect-error
            this.bind(prop, obj, objProp, transform);
        });
    }

    // FIXME: deprecated
    set properties(properties: Property[]) {
        if (!properties)
            return;

        console.warn(Error('"properties" is deprecated use "attribute" instead'));
        properties.forEach(([key, value]) => {
            (this as unknown as { [key: string]: unknown })[`_${key}`] = value;
        });
    }

    // FIXME: deprecated
    connectTo<GObject extends GObject.Object>(
        gobject: GObject,
        callback: (self: this, ...args: any[]) => void,
        signal?: string,
    ) {
        console.warn(Error('connectTo was renamed to hook'));
        return this.hook(gobject, callback, signal);
    }

    _setPack(orientation: 'h' | 'v', align: Align) {
        if (!align)
            return;

        if (!Object.keys(ALIGN).includes(align)) {
            return console.error(Error(
                `${orientation}pack has to be on of ${Object.keys(ALIGN)}, but it is ${align}`,
            ));
        }

        this[`${orientation}align`] = ALIGN[align];
    }

    _getPack(orientation: 'h' | 'v') {
        return Object.keys(ALIGN).find(align => {
            return ALIGN[align as Align] === this[`${orientation}align`];
        }) as Align;
    }

    get hpack() { return this._getPack('h'); }
    set hpack(align: Align) { this._setPack('h', align); }

    get vpack() { return this._getPack('v'); }
    set vpack(align: Align) { this._setPack('v', align); }

    toggleClassName(className: string, condition = true) {
        const c = this.get_style_context();
        condition
            ? c.add_class(className)
            : c.remove_class(className);

        this.notify('class-names');
        this.notify('class-name');
    }

    get class_name() {
        return this.class_names.join(' ');
    }

    set class_name(names: string) {
        this.class_names = names.split(/\s+/);
    }

    get class_names() {
        return this.get_style_context().list_classes() || [];
    }

    set class_names(names: string[]) {
        this.class_names.forEach((cn: string) => this.toggleClassName(cn, false));
        names.forEach(cn => this.toggleClassName(cn));
    }

    _cssProvider!: Gtk.CssProvider;
    setCss(css: string) {
        if (!css.includes('{') || !css.includes('}'))
            css = `* { ${css} }`;

        if (this._cssProvider)
            this.get_style_context().remove_provider(this._cssProvider);

        this._cssProvider = new Gtk.CssProvider();
        this._cssProvider.load_from_data(new TextEncoder().encode(css));
        this.get_style_context()
            .add_provider(this._cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);

        this.notify('css');
    }

    get css() {
        return this._cssProvider?.to_string() || '';
    }

    set css(css: string) {
        if (!css)
            return;

        this.setCss(css);
    }

    get child(): Gtk.Widget | null {
        // @ts-expect-error
        if (typeof this.get_child === 'function')
            // @ts-expect-error
            return this.get_child();

        return null;
    }

    set child(child: Gtk.Widget) {
        if (this.child !== child && this.child)
            this.child.destroy();

        // @ts-expect-error
        if (typeof this.set_child === 'function')
            // @ts-expect-error
            this.set_child(child);

        // @ts-expect-error
        else if (typeof this.add === 'function')
            // @ts-expect-error
            this.add(child);

        else
            console.error(Error(`can't set child on ${this}`));
    }

    _updateCursor() {
        if (!this.cursor)
            return;

        const display = Gdk.Display.get_default();

        if (this.isHovered() && display) {
            const cursor = Gdk.Cursor.new_from_name(display, this.cursor);
            this.get_window()?.set_cursor(cursor);
        }
        else if (display) {
            const cursor = Gdk.Cursor.new_from_name(display, 'default');
            this.get_window()?.set_cursor(cursor);
        }
    }

    get cursor() { return this._get('cursor'); }
    set cursor(cursor: Cursor) {
        this._set('cursor', cursor);
        this._updateCursor();
    }

    isHovered(event?: Gdk.Event) {
        let [x, y] = this.get_pointer();
        const { width: w, height: h } = this.get_allocation();
        if (event)
            [, x, y] = event.get_coords();

        return x > 0 && x < w && y > 0 && y < h;
    }

    get click_through() { return !!this._get('click-through'); }
    set click_through(clickThrough: boolean) {
        if (this.click_through === clickThrough)
            return;

        const value = clickThrough ? new Cairo.Region : null;
        this.input_shape_combine_region(value);
        this._set('click-through', value);
        this.notify('click-through');
    }
}

export function register<T extends { new(...args: any[]): Gtk.Widget }>(
    klass: T,
    config?: Parameters<typeof registerGObject>[1] & { cssName?: string },
) {
    Object.getOwnPropertyNames(AgsWidget.prototype).forEach(name => {
        Object.defineProperty(klass.prototype, name,
            Object.getOwnPropertyDescriptor(AgsWidget.prototype, name) ||
            Object.create(null),
        );
    });
    return registerGObject(klass, {
        cssName: config?.cssName,
        typename: config?.typename || `Ags_${klass.name}`,
        signals: config?.signals,
        properties: {
            ...config?.properties,
            'class-name': ['string', 'rw'],
            'class-names': ['jsobject', 'rw'],
            'css': ['string', 'rw'],
            'hpack': ['string', 'rw'],
            'vpack': ['string', 'rw'],
            'cursor': ['string', 'rw'],
            'is-destroyed': ['boolean', 'r'],
            'attribute': ['jsobject', 'rw'],
            'click-through': ['boolean', 'rw'],

            // FIXME: deprecated
            'properties': ['jsobject', 'w'],
            'connections': ['jsobject', 'w'],
            'binds': ['jsobject', 'w'],
        },
    });
}

// FIXME: backwards compatibility
export default function W(klass: any) {
    return klass;
}
W.register = register;
