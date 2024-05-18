import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';
import Cairo from 'gi://cairo?version=1.0';

type DrawFn<Self> = (self: Self, cr: Cairo.Context, width: number, height: number) => void

export type DrawingAreaProps<
    Attr = unknown,
    Self = DrawingArea<Attr>,
> = BaseProps<Self, Gtk.DrawingArea.ConstructorProperties & {
    draw_fn?: DrawFn<Self>
}, Attr>;

export function newDrawingArea<
    Attr = unknown
>(...props: ConstructorParameters<typeof DrawingArea<Attr>>) {
    return new DrawingArea(...props);
}

export interface DrawingArea<Attr> extends Widget<Attr> { }
export class DrawingArea<Attr> extends Gtk.DrawingArea {
    static {
        register(this, {
            properties: {
                'draw-fn': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: DrawingAreaProps<Attr> = {}) {
        super(props as Gtk.DrawingArea.ConstructorProperties);
        this.connect('draw', (self, cr: Cairo.Content) => {
            const w = this.get_allocated_width();
            const h = this.get_allocated_height();
            this.draw_fn(self, cr, w, h);
        });
    }

    get draw_fn() { return this._get('draw-fn') || (() => undefined); }
    set draw_fn(fn: DrawFn<this>) { this._set('draw-fn', fn); }
}

export default DrawingArea;
