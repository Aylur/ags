import AgsWidget, { type BaseProps } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

interface Context {
    setSourceRGBA: (r: number, g: number, b: number, a: number) => void
    arc: (x: number, y: number, r: number, a1: number, a2: number) => void
    setLineWidth: (w: number) => void
    lineTo: (x: number, y: number) => void
    stroke: () => void
    fill: () => void
    $dispose: () => void
}

export type CircularProgressProps = BaseProps<AgsCircularProgress, Gtk.Bin.ConstructorProperties &
{
    rounded?: boolean
    value?: number
    inverted?: boolean
    start_at?: number
    start_draw?: number
    end_draw?: number
}>

export default class AgsCircularProgress extends AgsWidget(Gtk.Bin) {
    static {
        AgsWidget.register(this, {
            cssName: 'circular-progress',
            properties: {
                'start-at': ['float', 'rw'],
                'start-draw': ['float', 'rw'],
                'end-draw': ['float', 'rw'],
                'value': ['float', 'rw'],
                'inverted': ['boolean', 'rw'],
                'rounded': ['boolean', 'rw'],
            },
        });
    }

    constructor(props: CircularProgressProps = {}) {
        super(props as Gtk.Bin.ConstructorProperties);
    }

    get rounded() { return this._get('rounded') || false; }
    set rounded(r: boolean) {
        if (this.rounded === r)
            return;

        this._set('rounded', r);
        this.queue_draw();
    }

    get inverted() { return this._get('inverted') || false; }
    set inverted(inverted: boolean) {
        if (this.inverted === inverted)
            return;

        this._set('inverted', inverted);
        this.queue_draw();
    }

    get start_at() { return this._get('start-at') || 0; }
    set start_at(value: number) {
        if (this.start_at === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;

        this._set('start-at', value);
        this.queue_draw();
    }

    get start_draw() { return this._get('start-draw') || 0; }
    set start_draw(value: number) {
        if (this.start_draw === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;


        this._set('start-draw', value);
        this.queue_draw();
    }

    get end_draw() { return this._get('end-draw') || 1; }
    set end_draw(value: number) {
        if (this.end_draw === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;

        this._set('end-draw', value);
        this.queue_draw();
    }

    get value() { return this._get('value') || 0; }
    set value(value: number) {
        if (this.value === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;


        this._set('value', value);
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

    private mapValueToRange(start: number, end: number, value: number): number {
        // Ensure that start is less than or equal to end
        if (start > end)
            [start, end] = [end, start];


        // Map the value from [0, 1] to the range [start, end]
        const mappedValue = start + (end - start) * value;

        // Ensure the mapped value is within the range [start, end]
        return Math.max(start, Math.min(end, mappedValue));
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

        const startDraw = this._toRadian(this.start_draw);
        const endDraw = this._toRadian(this.end_draw);

        const rangedValue = this.mapValueToRange(
            this.start_at,
            this.end_draw,
            this.value,
        );

        // Starts from the same point of start_draw if not a circle
        if (this.start_draw != 0 || this.end_draw != 1)
            this.start_at = this.start_draw;

        const from = this._toRadian(this.start_at);
        const to = this._toRadian(rangedValue);

        // Draw background
        cr.setSourceRGBA(bg.red, bg.green, bg.blue, bg.alpha);
        cr.arc(center.x, center.y, radius, startDraw, endDraw);

        cr.setLineWidth(bgStroke);
        cr.stroke();

        // Draw progress
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
        cr.arc(center.x, center.y, radius, this.inverted ? to : from, this.inverted ? from : to);
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
