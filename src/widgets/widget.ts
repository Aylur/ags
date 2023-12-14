import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib?version=2.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';
import { interval } from '../utils.js';
import { Variable } from '../variable.js';
import { App } from '../app.js';

function kebabify(str: string) {
    return str
        .split('')
        .map(char => char === char.toUpperCase()
            ? '_' + char.toLowerCase()
            : char,
        )
        .join('')
        .replaceAll('_', '-');
}

type OnlyString<S extends string | unknown> = S extends string ? S : never;

type Props<T> = Pick<T, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : OnlyString<K>
}[keyof T]>;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform?: (value: any) => any,
];

export interface BaseProps<Self> extends Gtk.Widget.ConstructorProperties {
    class_name?: string
    class_names?: string[]
    css?: string
    hpack?: Align
    vpack?: Align
    cursor?: Cursor
    connections?: Connection<Self>[]
    properties?: Property[]
    binds?: Bind[],
    setup?: (self: Self) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                    // order of these matter
                    'properties': pspec('properties'),
                    'setup': pspec('setup'),
                    'connections': pspec('connections'),
                    'binds': pspec('binds'),
                },
            }, this);
        }

        _init(config?: Gtk.Widget.ConstructorProperties): void {
            super._init(config);

            this.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK);
            this.add_events(Gdk.EventMask.LEAVE_NOTIFY_MASK);

            this.connect('enter-notify-event', this._updateCursor.bind(this));
            this.connect('leave-notify-event', this._updateCursor.bind(this));
        }

        _destroyed = false;

        // defining private fields for typescript causes
        // gobject constructor field setters to be overridden
        // so we use this _get and _set to avoid @ts-expect-error everywhere
        _get<T>(field: string) {
            return (this as unknown as { [key: string]: unknown })[`__${field}`] as T;
        }

        _set<T>(field: string, value: T) {
            if (this._get(field) === value)
                return;

            (this as unknown as { [key: string]: T })[`__${field}`] = value;
            this.notify(field);
        }

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
                    this.connectTo(s, callback, event);

                else
                    console.error(Error(`${s} is not a GObject | string | number`));
            });
        }

        set binds(binds: Bind[]) {
            if (!binds)
                return;

            binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
                // @ts-expect-error
                this.bind(prop, obj, objProp, transform);
            });
        }

        set properties(properties: Property[]) {
            if (!properties)
                return;

            properties.forEach(([key, value]) => {
                (this as unknown as { [key: string]: unknown })[`_${key}`] = value;
            });
        }

        set setup(setup: (self: AgsWidget) => void) {
            if (!setup)
                return;

            setup(this);
        }

        connectTo<GObject extends GObject.Object>(
            o: GObject,
            callback: (self: typeof this, ...args: unknown[]) => void,
            event?: string,
        ) {
            if (!(o instanceof GObject.Object)) {
                console.error(Error(`${o} is not a GObject`));
                return this;
            }

            if (!(o instanceof Service || o instanceof App || o instanceof Variable) && !event) {
                console.error(Error('you are trying to connect to a regular GObject ' +
                    'without specifying the signal'));
                return this;
            }

            const id = o.connect(event!, (_, ...args: unknown[]) => callback(this, ...args));

            this.connect('destroy', () => {
                this._destroyed = true;
                o.disconnect(id);
            });

            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                if (!this._destroyed)
                    callback(this);

                return GLib.SOURCE_REMOVE;
            });

            return this;
        }

        /**
         * NOTE: this can result in a runtime error if the types don't match
         */
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
                ? () => this[prop as Prop] = transform(gobject[targetProp as ObjProp])
                : () => gobject[targetProp as ObjProp];

            this.connectTo(gobject, callback, `notify::${kebabify(targetProp)}`);
            return this;
        }

        setPack(orientation: 'h' | 'v', align: Align) {
            if (!align)
                return;

            if (!Object.keys(ALIGN).includes(align)) {
                return console.error(Error(
                    `${orientation}pack has to be on of ${Object.keys(ALIGN)}, but it is ${align}`,
                ));
            }

            this[`${orientation}align`] = ALIGN[align];
        }

        getPack(orientation: 'h' | 'v') {
            return Object.keys(ALIGN).find(align => {
                return ALIGN[align as Align] === this[`${orientation}align`];
            }) as Align;
        }

        get hpack() { return this.getPack('h'); }
        set hpack(align: Align) { this.setPack('h', align); }

        get vpack() { return this.getPack('v'); }
        set vpack(align: Align) { this.setPack('v', align); }

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
    };
}
