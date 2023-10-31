import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import GLib from 'gi://GLib?version=2.0';
import Service from '../service.js';
import { interval } from '../utils.js';

type KebabCase<S extends string> = S extends `${infer Prefix}_${infer Suffix}`
    ? `${Prefix}-${KebabCase<Suffix>}` : S;

type OnlyString<S extends string | unknown> = S extends string ? S : never;

const aligns = ['fill', 'start', 'end', 'center', 'baseline'] as const;
type Align = typeof aligns[number];

type Property = [prop: string, value: unknown];

type Connection<Self> =
    [string, (self: Self, ...args: unknown[]) => unknown] |
    [number, (self: Self, ...args: unknown[]) => unknown] |
    [GObject.Object, (self: Self, ...args: unknown[]) => unknown, string];

type Bind = [
    prop: string,
    obj: GObject.Object,
    objProp?: string,
    transform?: (value: unknown) => unknown,
];

export interface BaseProps<Self> extends Gtk.Widget.ConstructorProperties {
    className?: string
    classNames?: string[]
    css?: string
    hpack?: Align
    vpack?: Align
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
                    // order of these matter
                    'setup': pspec('setup'),
                    'properties': pspec('properties'),
                    'connections': pspec('connections'),
                    'binds': pspec('binds'),
                },
            }, this);
        }

        private _destroyed = false;

        // defining private fields for typescript causes
        // gobject constructor field setters to be overridden
        // so we use this _get and _set to avoid @ts-expect-error everywhere
        protected _get<T>(field: string) {
            return (this as unknown as { [key: string]: unknown })[`_${field}`] as T;
        }

        protected _set<T>(field: string, value: T) {
            if (this._get(field) === value)
                return;

            (this as unknown as { [key: string]: T })[`_${field}`] = value;
            this.notify(field);
        }

        set connections(connections: Connection<AgsWidget>[]) {
            if (!connections)
                return;

            connections.forEach(([s, callback, event]) => {
                if (!s || !callback) {
                    console.error(Error('missing arguments to connections'));
                    return;
                }

                if (typeof s === 'string')
                    this.connect(s, callback);

                else if (typeof s === 'number')
                    interval(s, () => callback(this), this);

                else if (s instanceof GObject.Object)
                    this.connectTo(s, callback, event);

                else
                    console.error(Error(`${s} is not a GObject nor a string nor a number`));
            });
        }

        set binds(binds: Bind[]) {
            if (!binds)
                return;

            binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
                this.bind(
                    prop as KebabCase<OnlyString<keyof this>>,
                    obj,
                    objProp as keyof typeof obj,
                    transform,
                );
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
            event = 'changed',
        ) {
            if (!(o instanceof GObject.Object))
                return console.error(new Error(`${o} is not a GObject`));

            const id = o.connect(event, (_, ...args: unknown[]) => callback(this, ...args));

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

        bind<GObject extends GObject.Object>(
            prop: KebabCase<OnlyString<keyof typeof this>>,
            target: GObject,
            targetProp: OnlyString<keyof GObject>,
            // FIXME: typeof target[targetProp]
            transform: (value: typeof target[typeof targetProp]) => unknown = out => out,
        ) {
            // @ts-expect-error readonly property
            const callback = () => this[prop] = transform(target[targetProp]);
            this.connectTo(target, callback, `notify::${targetProp}`);
            return this;
        }

        get hpack() { return aligns[this.halign]; }
        set hpack(align: Align) {
            if (!align)
                return;

            if (!aligns.includes(align)) {
                console.error(new Error(`halign has to be on of ${aligns}`));
                return;
            }

            this.halign = aligns.findIndex(a => a === align);
        }

        get vpack() { return aligns[this.valign]; }
        set vpack(align: Align) {
            if (!align)
                return;

            if (!aligns.includes(align)) {
                console.error(new Error(`valign has to be on of ${aligns}`));
                return;
            }

            this.valign = aligns.findIndex(a => a === align);
        }

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
            // @ts-expect-error
            if (typeof this.set_child === 'function')
                // @ts-expect-error
                this.set_child(child);
            else
                console.error(new Error(`can't set child on ${this}`));
        }
    };
}
