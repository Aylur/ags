import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Service from '../service/service.js';

// type from gi-types is wrong
interface Context {
    setSourceRGBA: (r: number, g: number, b: number, a: number) => void
    arc: (x: number, y: number, r: number, a1: number, a2: number) => void
    setLineWidth: (w: number) => void
    lineTo: (x: number, y: number) => void
    stroke: () => void
    fill: () => void
    $dispose: () => void
}

export default class AgsCircularProgress extends Gtk.Bin {
    static {
        GObject.registerClass({
            GTypeName: 'AgsCircularProgress',
            Properties: {
                'start-at': Service.pspec('start-at', 'float', 'rw'),
                'inverted': Service.pspec('inverted', 'boolean', 'rw'),
                'rounded': Service.pspec('rounded', 'boolean', 'rw'),
                'value': Service.pspec('value', 'float', 'rw'),
            },
        }, this);
    }

    // @ts-expect-error
    get rounded() { return this._rounded; }
    set rounded(r: boolean) {
        if (this.rounded === r)
            return;

        // @ts-expect-error
        this._rounded = r;
        this.notify('rounded');
        this.queue_draw();
    }

    // @ts-expect-error
    get inverted() { return this._inverted; }
    set inverted(inverted: boolean) {
        if (this.inverted === inverted)
            return;

        // @ts-expect-error
        this._inverted = inverted;
        this.notify('inverted');
        this.queue_draw();
    }

    // @ts-expect-error
    get start_at() { return this._startAt; }
    set start_at(value: number) {
        if (this.start_at === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;

        // @ts-expect-error
        this._startAt = value;
        this.notify('start-at');
        this.queue_draw();
    }

    // @ts-expect-error
    get value() { return this._value; }
    set value(value: number) {
        if (this.value === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;


        // @ts-expect-error
        this._value = value;
        this.notify('value');
        this.queue_draw();
    }

    vfunc_get_preferred_height(): [number, number] {
        let minHeight = this.get_style_context()
            .get_property('min-height', Gtk.StateFlags.NORMAL) as number;
        if (minHeight <= 0)
            minHeight = 40;

        return [minHeight, minHeight];
    }

    vfunc_get_preferred_width(): [number, number] {
        let minWidth = this.get_style_context()
            .get_property('min-width', Gtk.StateFlags.NORMAL) as number;
        if (minWidth <= 0)
            minWidth = 40;

        return [minWidth, minWidth];
    }

    private _toRadian(percentage: number) {
        percentage = Math.floor(percentage * 100);
        return (percentage / 100) * (2 * Math.PI);
    }

    vfunc_draw(cr: Context): boolean {
        const allocation = this.get_allocation();
        const styles = this.get_style_context();
        const width = allocation.width;
        const height = allocation.height;
        const thickness = styles.get_property('font-size', Gtk.StateFlags.NORMAL) as number;
        const margin = styles.get_margin(Gtk.StateFlags.NORMAL);
        const fg = styles.get_color(Gtk.StateFlags.NORMAL);
        const bg = styles.get_background_color(Gtk.StateFlags.NORMAL);
        const bgStroke = thickness + Math.min(margin.bottom, margin.top, margin.left, margin.right);
        const fgStroke = thickness;
        const radius = Math.min(width, height) / 2.0 - Math.max(bgStroke, fgStroke) / 2.0;
        const center = { x: width / 2, y: height / 2 };
        const from = this._toRadian(this.start_at);
        const to = this._toRadian(this.value + this.start_at);

        // Draw background
        cr.setSourceRGBA(bg.red, bg.green, bg.blue, bg.alpha);
        cr.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        cr.setLineWidth(bgStroke);
        cr.stroke();

        // Draw progress
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
        cr.arc(center.x, center.y, radius, this.inverted ? from : to, this.inverted ? to : from);
        cr.setLineWidth(fgStroke);
        cr.stroke();

        // Draw rounded ends
        if (this.rounded) {
            const start = {
                x: center.x + Math.cos(from) * radius,
                y: center.y + Math.sin(from) * radius,
            };
            const end = {
                x: center.x + Math.cos(to) * radius,
                y: center.y + Math.sin(to) * radius,
            };
            cr.setLineWidth(0);
            cr.arc(start.x, start.y, fgStroke / 2, 0, 0 - 0.01);
            cr.fill();
            cr.arc(end.x, end.y, fgStroke / 2, 0, 0 - 0.01);
            cr.fill();
        }

        if (this.child) {
            this.child.size_allocate(allocation);
            this.propagate_draw(this.child, cr);
        }

        cr.$dispose();
        return true;
    }
}
