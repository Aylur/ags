import { Widget } from 'gi-types/gtk4';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';

export default class CircularProgressBarBin extends Gtk.Bin {
    static {
        GObject.registerClass({
            GTypeName: 'CircularProgressBarBin',
            Properties: {
                'angle': GObject.ParamSpec.double(
                    'angle',
                    'Angle',
                    'The angle of progress in degrees',
                    GObject.ParamFlags.READWRITE,
                    0, 360, 0,
                ),
                'value': GObject.ParamSpec.double(
                    'value',
                    'Value',
                    'The progress percentage',
                    GObject.ParamFlags.READWRITE,
                    0, 100, 0,
                ),
                'child': GObject.ParamSpec.object(
                    'child',
                    'Child Widget',
                    'The child widget of the CircularProgressBarBin',
                    GObject.ParamFlags.READWRITE,
                    Gtk.Widget.$gtype,
                ),
            },
        }, this);
    }

    private angle: number;

    constructor(args: { child?: Gtk.Widget } = {}) {
        const { child } = args;
        super();
        this.angle = 0;

        if (child)
            this.add(child);

        this.connect('draw', this.onDraw.bind(this));
    }

    set value(newValue: number) {
        if (newValue > 100)
            newValue = 0;

        this.angle = newValue * 3.6;
        this.queue_draw();
    }

    get value(): number {
        return (this.angle / 3.6);
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

    onDraw(_widget: Gtk.Widget, cr: any) {
        const allocation = this.get_allocation();
        const width = allocation.width;
        const height = allocation.height;
        const radius = Math.min(width, height) / 2.5;
        const centerX = width / 2;
        const centerY = height / 2;
        const startAngle = -Math.PI / 2;

        const child = this.get_child();
        const styles = this.get_style_context();

        const progressColor = styles.get_color(Gtk.StateFlags.NORMAL);
        const progressBackgroundColor = styles.get_background_color(Gtk.StateFlags.NORMAL);
        let fontSize = styles
            .get_property('font-size', Gtk.StateFlags.NORMAL) as number; // Get font size

        if (fontSize === 14.666666666666666)
            fontSize = 2;

        // Draw background circle outline
        cr.setSourceRGBA(
            progressBackgroundColor.red,
            progressBackgroundColor.green,
            progressBackgroundColor.blue,
            progressBackgroundColor.alpha,
        );
        cr.arc(
            centerX,
            centerY,
            radius,
            0,
            2 * Math.PI,
        );
        if (child) {
            cr.setLineWidth(fontSize); // Set the outline width as desired
            cr.stroke(); // Stroke the outline
        } else {
            cr.fill();
        }

        // Draw progress arc outline
        cr.setSourceRGBA(
            progressColor.red,
            progressColor.green,
            progressColor.blue,
            progressColor.alpha,
        );
        cr.arc(
            centerX,
            centerY,
            radius,
            startAngle,
            startAngle + (Math.PI / 180) * this.angle,
        );
        if (child) {
            cr.setLineWidth(fontSize); // Set the outline width as desired
            cr.stroke(); // Stroke the outline
        } else {
            cr.lineTo(centerX, centerY);
            cr.fill();
        }


        if (child)
            this.propagate_draw(child, cr);
    }
}
