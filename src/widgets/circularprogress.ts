import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import cairo from 'gi://cairo';

export default class CircularProgressBarFixed extends Gtk.Fixed {
    static {
        GObject.registerClass({
            GTypeName: 'CircularProgressBarFixed',
        }, this);
    }

    private angle: number;
    private progress: number;
    private _className: string[];
    private childWidget?: Gtk.Widget;

    constructor(args: { className?: string[]; childWidget?: Gtk.Widget } = {}) {
        super();
        this.angle = 0;
        this.progress = 0;
        this._className = [];

        if (args.className) {
            this._className.push(...args.className);
        }

        if (args.childWidget) {
            this.childWidget = args.childWidget;
            this.put(args.childWidget, 0, 0);
        }

        this.connect('draw', this.onDraw.bind(this));
    }

    updateProgress(newProgress: number): boolean {
        this.progress = newProgress;
        if (this.progress > 100)
            this.progress = 0;

        this.angle = this.progress * 3.6; // Each percent corresponds to 3.6 degrees
        this.queue_draw();
        return true;
    }

    vfunc_get_preferred_height(): [number, number] {
        let minHeight = this.get_style_context().get_property('min-height', Gtk.StateFlags.NORMAL) as number;
        if (minHeight <= 0)
            minHeight = 40;

        return [minHeight, minHeight];
    }

    vfunc_get_preferred_width(): [number, number] {
        let minWidth = this.get_style_context().get_property('min-width', Gtk.StateFlags.NORMAL) as number;
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
        let startAngle = -Math.PI / 90;

        const styles = this.get_style_context();

        this._className.forEach((element) => {
            styles.add_class(element);
        });

        const progressColor = styles.get_color(Gtk.StateFlags.NORMAL);
        const progressBackgroundColor = styles.get_background_color(Gtk.StateFlags.NORMAL);
        let fontSize = styles.get_property('font-size', Gtk.StateFlags.NORMAL) as number; // Get font size

        if (fontSize === 14.666666666666666)
            fontSize = 2;

        // Draw background circle outline
        cr.setSourceRGBA(
            progressBackgroundColor.red,
            progressBackgroundColor.green,
            progressBackgroundColor.blue,
            progressBackgroundColor.alpha,
        );
        cr.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        cr.setLineWidth(fontSize); // Set the outline width as desired
        cr.stroke(); // Stroke the outline

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
        cr.setLineWidth(fontSize); // Set the outline width as desired
        cr.stroke(); // Stroke the outline

        if (this.childWidget) {
            const label_width = this.childWidget.get_allocation().width;
            const label_height = this.childWidget.get_allocation().height;
            const label_x = centerX - (label_width / 2);
            const label_y = centerY - (label_height / 2);

            this.move(this.childWidget, label_x, label_y);
        }
    }
}
