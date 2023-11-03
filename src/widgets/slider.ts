import AgsWidget, { type BaseProps } from './widget.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';

type EventHandler = (self: AgsSlider, event: Gdk.Event) => void | unknown;

export interface SliderProps extends BaseProps<AgsSlider>, Gtk.Scale.ConstructorProperties {
    onChange?: EventHandler,
    value?: number
    min?: number
    max?: number
    step?: number
}

export default class AgsSlider extends AgsWidget(Gtk.Scale) {
    static {
        GObject.registerClass({
            GTypeName: 'AgsSlider',
            Properties: {
                'dragging': Service.pspec('dragging', 'boolean', 'r'),
                'vertical': Service.pspec('vertical', 'boolean', 'rw'),
                'value': Service.pspec('value', 'double', 'rw'),
                'min': Service.pspec('min', 'double', 'rw'),
                'max': Service.pspec('max', 'double', 'rw'),
                'step': Service.pspec('step', 'double', 'rw'),
            },
        }, this);
    }

    constructor({
        value = 0,
        min = 0,
        max = 1,
        step = 0.01,
        ...rest
    }: SliderProps = {}) {
        super({
            ...rest,
            adjustment: new Gtk.Adjustment({
                lower: min,
                upper: max,
                step_increment: step,
                value: value,
            }),
        });

        this.adjustment.connect('notify::value', (_, event: Gdk.Event) => {
            if (!this.dragging)
                return;

            this.on_change?.(this, event);
        });
    }

    get on_change() { return this._get('on-change'); }
    set on_change(callback: EventHandler) { this._set('on-change', callback); }

    get value() { return this.adjustment.value; }
    set value(value: number) {
        if (this.dragging || this.value === value)
            return;

        this.adjustment.value = value;
        this.notify('value');
    }

    get min() { return this.adjustment.lower; }
    set min(min: number) {
        if (this.min === min)
            return;

        this.adjustment.lower = min;
        this.notify('min');
    }

    get max() { return this.adjustment.upper; }
    set max(max: number) {
        if (this.max === max)
            return;

        this.adjustment.upper = max;
        this.notify('max');
    }

    get step() { return this.adjustment.step_increment; }
    set step(step: number) {
        if (this.step === step)
            return;

        this.adjustment.step_increment = step;
        this.notify('step');
    }

    get dragging() { return this._get('dragging'); }
    set dragging(dragging: boolean) { this._set('dragging', dragging); }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(vertical) {
        if (this.vertical === vertical)
            return;

        this.orientation = vertical
            ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL;

        this.notify('vertical');
    }

    vfunc_button_release_event(event: Gdk.EventButton): boolean {
        this.dragging = false;
        return super.vfunc_button_release_event(event);
    }

    vfunc_button_press_event(event: Gdk.EventButton): boolean {
        this.dragging = true;
        return super.vfunc_button_press_event(event);
    }

    vfunc_key_press_event(event: Gdk.EventKey): boolean {
        this.dragging = true;
        return super.vfunc_key_press_event(event);
    }

    vfunc_key_release_event(event: Gdk.EventKey): boolean {
        this.dragging = false;
        return super.vfunc_key_release_event(event);
    }

    vfunc_scroll_event(event: Gdk.EventScroll): boolean {
        this.dragging = true;
        event.delta_y > 0
            ? this.adjustment.value -= this.step
            : this.adjustment.value += this.step;

        this.dragging = false;
        return super.vfunc_scroll_event(event);
    }
}
