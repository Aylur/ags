import GObject from 'gi://GObject';
import type GObjectTypes from "../../types/gtk-types/gobject-2.0"
import Gtk from 'gi://Gtk?version=3.0';
import type GtkTypes from "../../types/gtk-types/gtk-3.0"
import Service from '../service.js';
import { interval, connect } from '../utils.js';

// TODO: remove this type and make them only functions
export type Command = string | ((...args: unknown[]) => boolean);

const aligns = ['fill', 'start', 'end', 'center', 'baseline'];
const widgetProviders: Map<unknown, GtkTypes.CssProvider> = new Map();

export interface BaseProps<Self> {
    className?: string
    classNames?: string[]
    style?: string
    css?: string
    halign?: 'fill' | 'start' | 'end' | 'center' | 'baseline'
    valign?: 'fill' | 'start' | 'end' | 'center' | 'baseline'
    connections?: (
        [string, (self: Self, ...args: unknown[]) => unknown] |
        [number, (self: Self, ...args: unknown[]) => unknown] |
        [GObjectTypes.Object, (self: Self, ...args: unknown[]) => unknown, string]
    )[]
    properties?: [prop: string, value: unknown][]
    binds?: [
        prop: string,
        obj: GObjectTypes.Object,
        objProp?: string,
        transform?: (value: unknown) => unknown,
    ][],
    setup?: (self: Self) => void
}

export default function <T extends typeof Gtk.Widget, Props>(W: T, GTypeName?: string) {
    // @ts-expect-error mixin constructor
    return class AgsWidget extends W {
        static {
            GObject.registerClass({
                GTypeName: GTypeName || `${W.name}`,
                Properties: {
                    'class-name': Service.pspec('class-name', 'string', 'rw'),
                    'class-names': Service.pspec('class-names', 'jsobject', 'rw'),
                    'css': Service.pspec('css', 'string', 'rw'),
                },
            }, this);
        }

        constructor(params: BaseProps<T> & Props | any = {}) {
            const {
                connections = [],
                properties = [],
                binds = [],
                style,
                halign,
                valign,
                setup,
                ...rest
            } = params as BaseProps<T> & Props;
            super(typeof params === 'object' ? rest : params);

            this.style = style!;
            this.halign = halign!;
            this.valign = valign!;

            properties.forEach(([key, value]) => {
                (this as unknown as { [key: string]: unknown })[`_${key}`] = value;
            });

            binds.forEach(([prop, obj, objProp = 'value', transform = out => out]) => {
                if (!prop || !obj) {
                    console.error(Error('missing arguments to binds'));
                    return;
                }

                // @ts-expect-error
                const callback = () => this[prop] = transform(obj[objProp]);
                connections.push([obj, callback, `notify::${objProp}`]);
            });

            connections.forEach(([s, callback, event]) => {
                if (!s || !callback) {
                    console.error(Error('missing arguments to connections'));
                    return;
                }

                if (typeof s === 'string')
                    this.connect(s, callback);

                else if (typeof s === 'number')
                    interval(s, () => callback(this as any), this as unknown as GtkTypes.Widget);

                else if (s instanceof GObject.Object)
                    connect(s, this as unknown as GtkTypes.Widget, callback as any, event);

                else
                    console.error(Error(`${s} is not a GObject nor a string nor a number`));
            });

            if (typeof setup === 'function')
                setup(this as any);
        }

        toggleClassName(className: string, condition = true) {
            condition
                ? this.get_style_context().add_class(className)
                : this.get_style_context().remove_class(className);
        }

        // @ts-expect-error prop override
        get halign() { return aligns[super.halign]; }

        // @ts-expect-error prop override
        set halign(align: string) {
            if (!align)
                return;

            if (!aligns.includes(align)) {
                console.error(new Error(`halign has to be on of ${aligns}`));
                return;
            }

            super.halign = aligns.findIndex(a => a === align);
        }

        // @ts-expect-error prop override
        get valign() { return aligns[super.valign]; }

        // @ts-expect-error prop override
        set valign(align: string) {
            if (!align)
                return;

            if (!aligns.includes(align)) {
                console.error(new Error(`valign has to be on of ${aligns}`));
                return;
            }

            super.valign = aligns.findIndex(a => a === align);
        }

        get class_name() {
            // @ts-expect-error
            return this._className || '';
        }

        set class_name(names: string) {
            // @ts-expect-error
            this._className = names;
            this.class_names = names.split(/\s+/);
            this.notify('class-name');
        }

        get class_names() {
            // @ts-expect-error
            return this._classNames || [];
        }

        set class_names(names: string[]) {
            this.class_names.forEach((cn: string) => this.toggleClassName(cn, false));

            // @ts-expect-error
            this._classNames = names.map(cn => {
                this.toggleClassName(cn);
                return cn;
            });

            this.notify('class-names');
        }

        setCss(css: string) {
            const previous = widgetProviders.get(this);
            if (previous)
                this.get_style_context().remove_provider(previous);

            const provider = new Gtk.CssProvider();
            widgetProviders.set(this, provider);
            provider.load_from_data(new TextEncoder().encode(css));
            this.get_style_context()
                .add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);

            this.notify('css');
        }

        setStyle(css: string) {
            this.setCss(`* { ${css} }`);
            this.notify('style');
        }

        // @ts-expect-error prop override
        get style() { return this._style || ''; }

        // @ts-expect-error prop override
        set style(css: string) {
            if (!css)
                return;

            // @ts-expect-error
            this._style = css;
            this.setCss(`* { ${css} }`);
            this.notify('style');
        }

        // @ts-expect-error
        get css() { return this._css || ''; }
        set css(css: string) {
            if (!css)
                return;

            // @ts-expect-error
            this._css = css;
            this.setCss(css);
            this.notify('css');
        }

        get child(): GtkTypes.Widget | null {
            // @ts-expect-error
            if (typeof this.get_child === 'function')
                // @ts-expect-error
                return this.get_child();

            return null;
        }

        set child(child: GtkTypes.Widget) {
            // @ts-expect-error
            if (typeof this.set_child === 'function')
                // @ts-expect-error
                this.set_child(child);
            else
                console.error(new Error(`can't set child on ${this}`));
        }

        // @ts-expect-error prop override
        get parent(): GtkTypes.Container | null {
            return this.get_parent() as GtkTypes.Container || null;
        }
    };
}
