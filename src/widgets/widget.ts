import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service.js';
import { interval, connect } from '../utils.js';

// FIXME: remove this type and make them only functions
export type Command = string | ((...args: unknown[]) => boolean | undefined);

const aligns = ['fill', 'start', 'end', 'center', 'baseline'] as const;
type Align = typeof aligns[number];

type Connection<Self> =
    [string, (self: Self, ...args: unknown[]) => unknown] |
    [number, (self: Self, ...args: unknown[]) => unknown] |
    [GObject.Object, (self: Self, ...args: unknown[]) => unknown, string];

type Property = [prop: string, value: unknown];
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
                    connect(s, this, callback, event);

                else
                    console.error(Error(`${s} is not a GObject nor a string nor a number`));
            });
        }

        set binds(binds: Bind[]) {
            if (!binds)
                return;

            binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
                if (!prop || !obj) {
                    console.error(Error('missing arguments to binds'));
                    return;
                }

                // @ts-expect-error
                const callback = () => this[prop] = transform(obj[objProp]);
                this.connections = [[obj, callback, `notify::${objProp}`]];
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
