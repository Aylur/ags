import { register, type BaseProps, type Widget } from './widget.js';
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

export type CircularProgressProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = CircularProgress<Child, Attr>
> = BaseProps<Self, Gtk.Bin.ConstructorProperties & {
    child?: Child
    rounded?: boolean
    value?: number
    inverted?: boolean
    start_at?: number
    end_at?: number
}, Attr>

export function newCircularProgress<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof CircularProgress<Child, Attr>>) {
    return new CircularProgress(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CircularProgress<Child, Attr> extends Widget<Attr> { }
export class CircularProgress<
    Child extends Gtk.Widget,
    Attr = unknown,
> extends Gtk.Bin {
    static {
        register(this, {
            cssName: 'circular-progress',
            properties: {
                'start-at': ['float', 'rw'],
                'end-at': ['float', 'rw'],
                'value': ['float', 'rw'],
                'inverted': ['boolean', 'rw'],
                'rounded': ['boolean', 'rw'],
            },
        });
    }

    constructor(props: CircularProgressProps<Child, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;

        super(props as Gtk.Bin.ConstructorProperties);
    }

    get child() { return super.child as Child; }
    set child(child: Child) { super.child = child; }

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

    get end_at() { return this._get('end-at') || this.start_at; }
    set end_at(value: number) {
        if (this.end_at === value)
            return;

        if (value > 1)
            value = 1;

        if (value < 0)
            value = 0;

        this._set('end-at', value);
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


    private _isFullCircle(start: number, end: number, epsilon = 1e-10): boolean {
        // Ensure that start and end are between 0 and 1
        start = (start % 1 + 1) % 1;
        end = (end % 1 + 1) % 1;

        // Check if the difference between start and end is close to 1
        return Math.abs(start - end) <= epsilon;
    }

    private _scaleArcValue(start: number, end: number, value: number): number {
        // Ensure that start and end are between 0 and 1
        start = (start % 1 + 1) % 1;
        end = (end % 1 + 1) % 1;

        // Calculate the length of the arc
        let arcLength = end - start;
        if (arcLength < 0)
            arcLength += 1; // Adjust for circular representation

        // Calculate the scaled value on the arc based on the arcLength
        let scaled = arcLength * value;

        // Ensure the scaled value is between 0 and 1
        scaled = (scaled % 1 + 1) % 1;

        return scaled;
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

        const startBackground = this._toRadian(this.start_at);
        let endBackground = this._toRadian(this.end_at);
        let rangedValue;

        const isCircle = this._isFullCircle(this.start_at, this.end_at);

        if (isCircle) {
            // Redefine endDraw in radius to create an accurate full circle
            endBackground = startBackground + 2 * Math.PI;
            rangedValue = this._toRadian(this.value);
        } else {
            // Scale the value for the arc shape
            rangedValue = this._toRadian(
                this._scaleArcValue(
                    this.start_at,
                    this.end_at,
                    this.value,
                ),
            );
        }

        let startProgress, endProgress;

        if (this.inverted) {
            startProgress = endBackground - rangedValue;
            endProgress = endBackground;
        } else {
            startProgress = startBackground;
            endProgress = startBackground + rangedValue;
        }

        // Draw background
        cr.setSourceRGBA(bg.red, bg.green, bg.blue, bg.alpha);
        cr.arc(center.x, center.y, radius, startBackground, endBackground);
        cr.setLineWidth(bgStroke);
        cr.stroke();

        // Draw rounded background ends
        if (this.rounded) {
            const start = {
                x: center.x + Math.cos(startBackground) * radius,
                y: center.y + Math.sin(startBackground) * radius,
            };
            const end = {
                x: center.x + Math.cos(endBackground) * radius,
                y: center.y + Math.sin(endBackground) * radius,
            };
            cr.setLineWidth(0);
            cr.arc(start.x, start.y, fgStroke / 2, 0, 0 - 0.01);
            cr.fill();
            cr.arc(end.x, end.y, fgStroke / 2, 0, 0 - 0.01);
            cr.fill();
        }

        // Draw progress
        cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
        cr.arc(center.x, center.y, radius, startProgress, endProgress);
        cr.setLineWidth(fgStroke);
        cr.stroke();

        // Draw rounded progress ends
        if (this.rounded) {
            const start = {
                x: center.x + Math.cos(startProgress) * radius,
                y: center.y + Math.sin(startProgress) * radius,
            };
            const end = {
                x: center.x + Math.cos(endProgress) * radius,
                y: center.y + Math.sin(endProgress) * radius,
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

export default CircularProgress;
