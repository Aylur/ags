import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib?version=2.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service, { kebabify, Props, BindableProps, Binding } from '../service.js';
import { interval } from '../utils.js';
import { Variable } from '../variable.js';
import { App } from '../app.js';

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

export type Property = [prop: string, value: unknown];

export type Connection<Self> =
    | [GObject.Object, (self: Self, ...args: unknown[]) => unknown, string?]
    | [string, (self: Self, ...args: unknown[]) => unknown]
    | [number, (self: Self, ...args: unknown[]) => unknown];

export type Bind = [
    prop: string,
    obj: GObject.Object,
    objProp?: string,
    transform?: (value: any) => any,
];

export type BaseProps<Self, Props> = {
    setup?: (self: Self) => void
} & BindableProps<Props & {
    class_name?: string
    class_names?: string[]
    css?: string
    hpack?: Align
    vpack?: Align
    cursor?: Cursor
    attribute?: any

    // FIXME: deprecated
    connections?: Connection<Self>[]
    properties?: Property[]
    binds?: Bind[],
}>

type WidgetCtor = new (...args: any[]) => Gtk.Widget;
export default function <T extends WidgetCtor>(Widget: T, GTypeName?: string) {
    return class AgsWidget extends Widget {
        static {
            const pspec = (name: string) => GObject.ParamSpec.jsobject(
                name, name, name, GObject.ParamFlags.CONSTRUCT_ONLY | GObject.ParamFlags.WRITABLE);

            GObject.registerClass({
                GTypeName: `Ags_${GTypeName || Widget.name}`,
                Properties: {
                    'class-name': Service.pspec('class-name', 'string', 'rw'),
                    'class-names': Service.pspec('class-names', 'jsobject', 'rw'),
                    'css': Service.pspec('css', 'string', 'rw'),
                    'hpack': Service.pspec('hpack', 'string', 'rw'),
                    'vpack': Service.pspec('vpack', 'string', 'rw'),
                    'cursor': Service.pspec('cursor', 'string', 'rw'),
                    'is-destroyed': Service.pspec('is-destroyed', 'boolean', 'r'),
                    'attribute': Service.pspec('attribute', 'jsobject', 'rw'),

                    // FIXME: deprecated
                    'properties': pspec('properties'),
                    'connections': pspec('connections'),
                    'binds': pspec('binds'),
                },
            }, this);
        }

        _handleParamProp<
            Prop extends keyof this
        >(prop: Prop, value?: this[Prop] | Binding<any, any, this[Prop]>) {
            if (value === undefined)
                return;

            if (value instanceof Binding)
                this.bind(prop, value.emitter, value.prop, value.transformFn);
            else
                this[prop] = value;
        }

        _init(config: Gtk.Widget.ConstructorProperties = {}) {
            // this type casting is here becaus _init's signature can't be altered
            const params = config as BaseProps<AgsWidget, Gtk.Widget.ConstructorProperties>;
            const { setup, ...props } = params;

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

            (binds as unknown as Array<[keyof typeof this, Binding<any, any, any>]>)
                .forEach(([selfProp, { emitter, prop, transformFn }]) => {
                    this.bind(selfProp, emitter, prop, transformFn);
                });

            this.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK);
            this.add_events(Gdk.EventMask.LEAVE_NOTIFY_MASK);

            this.connect('enter-notify-event', this._updateCursor.bind(this));
            this.connect('leave-notify-event', this._updateCursor.bind(this));
            this.connect('destroy', () => this._set('is-destroyed', true));

            if (setup)
                setup(this);
        }

        get is_destroyed() { return this._get('is-destroyed') || false; }

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
        set connections(connections: Connection<AgsWidget>[]) {
            if (!connections)
                return;

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

            binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
                // @ts-expect-error
                this.bind(prop, obj, objProp, transform);
            });
        }

        // FIXME: deprecated
        set properties(properties: Property[]) {
            if (!properties)
                return;

            properties.forEach(([key, value]) => {
                (this as unknown as { [key: string]: unknown })[`_${key}`] = value;
            });
        }

        // FIXME: deprecated
        connectTo<GObject extends GObject.Object>(
            gobject: GObject,
            callback: (self: typeof this, ...args: any[]) => void,
            signal?: string,
        ) {
            console.warn(Error('connectTo was renamed to hook'));
            return this.hook(gobject, callback, signal);
        }

        set attribute(attr: any) { this._set('attribute', attr); }
        get attribute() { return this._get('attribute'); }

        hook<GObject extends GObject.Object>(
            gobject: GObject | App,
            callback: (self: typeof this, ...args: any[]) => void,
            signal?: string,
        ) {
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

            const id = gobject.connect(signal!, (_, ...args: unknown[]) => callback(this, ...args));

            this.connect('destroy', () => {
                this._set('is-destroyed', true);
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
            Prop extends keyof this, // keyof Props<this> doesn't work?
            Gobject extends GObject.Object,
            ObjProp extends keyof Props<Gobject>,
        >(
            prop: Prop,
            gobject: Gobject,
            objProp?: ObjProp,
            transform?: (value: Gobject[ObjProp]) => this[Prop],
        ) {
            const targetProp = objProp || 'value';
            const callback = transform
                ? () => this[prop] = transform(gobject[targetProp as ObjProp])
                : () => {
                    const v = gobject[targetProp as ObjProp];
                    this[prop] = v as unknown as typeof this[Prop];
                };

            this.hook(gobject, callback, `notify::${kebabify(targetProp)}`);
            return this;
        }

        on(
            signal: string, // Parameters<this['connect']>[0], // this only has the last entry,
            callback: (self: this, ...args: any[]) => void,
        ) {
            this.connect(signal, callback);
            return this;
        }

        poll(timeout: number, callback: (self: this) => void) {
            callback(this);
            interval(timeout, () => callback(this), this);
            return this;
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
            return this._cssProvider.to_string() || '';
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
    };
}
