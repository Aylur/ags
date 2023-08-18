import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { runCmd } from '../utils.js';
import { EventButton, EventScroll } from 'gi-types/gdk3';

export default class Slider extends Gtk.Scale {
    static {
        GObject.registerClass({
            GTypeName: 'AgsSlider',
            Properties: {
                'value': GObject.ParamSpec.float(
                    'value', 'Value', 'Value',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    -100, 100, 0,
                ),
                'min': GObject.ParamSpec.float(
                    'min', 'Min', 'Min',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    -100, 100, 0,
                ),
                'max': GObject.ParamSpec.float(
                    'max', 'Max', 'Max',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    -100, 100, 1,
                ),
                'step': GObject.ParamSpec.float(
                    'step', 'Step', 'Step',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    -100, 100, 0.01,
                ),
                'dragging': GObject.ParamSpec.boolean(
                    'dragging', 'Dragging', 'Dragging',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    false,
                ),
                'vertical': GObject.ParamSpec.boolean(
                    'vertical', 'Vertical', 'Vertical',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    false,
                ),
            },
        }, this);
    }

    onChange: string | ((...args: any[]) => boolean);

    constructor({ onChange = '', ...rest }) {
        super({ ...rest, adjustment: new Gtk.Adjustment() });
        this.onChange = onChange;

        this.bind_property(
            'value', this.adjustment, 'value',
            GObject.BindingFlags.BIDIRECTIONAL |
            GObject.BindingFlags.SYNC_CREATE,
        );

        this.bind_property(
            'min', this.adjustment, 'lower',
            GObject.BindingFlags.BIDIRECTIONAL |
            GObject.BindingFlags.SYNC_CREATE,
        );

        this.bind_property(
            'max', this.adjustment, 'upper',
            GObject.BindingFlags.BIDIRECTIONAL |
            GObject.BindingFlags.SYNC_CREATE,
        );

        this.bind_property(
            'step', this.adjustment, 'step-increment',
            GObject.BindingFlags.BIDIRECTIONAL |
            GObject.BindingFlags.SYNC_CREATE,
        );

        this.connect('notify::value', ({ value }, event) => {
            if (!this._dragging)
                return;

            typeof this.onChange === 'function'
                ? this.onChange(this, event, value)
                : runCmd(onChange.replace(/\{\}/g, value));
        });
    }

    _value = 0;
    get value() { return this._value; }
    set value(value: number) {
        if (this.dragging)
            return;

        this._value = value;
        this.notify('value');
    }

    _min = 0;
    get min() { return this._min; }
    set min(min: number) {
        this._min = min;
        this.notify('min');
    }

    _max = 1;
    get max() { return this._max; }
    set max(max: number) {
        this._max = max;
        this.notify('max');
    }

    _step = 0.01;
    get step() { return this._step; }
    set step(step: number) {
        this._step = step;
        this.notify('step');
    }

    _dragging = false;
    get dragging() { return this._dragging; }
    set dragging(dragging: boolean) {
        this._dragging = dragging;
        this.notify('dragging');
    }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(vertical) {
        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;
    }

    vfunc_button_release_event(event: EventButton): boolean {
        this.dragging = false;
        return super.vfunc_button_release_event(event);
    }

    vfunc_button_press_event(event: EventButton): boolean {
        this.dragging = true;
        return super.vfunc_button_press_event(event);
    }

    vfunc_scroll_event(event: EventScroll): boolean {
        this.dragging = true;
        event.delta_y > 0
            ? this.adjustment.value -= this.step
            : this.adjustment.value += this.step;

        this.dragging = false;
        return super.vfunc_scroll_event(event);
    }
}
