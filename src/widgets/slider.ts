import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=3.0';
import { runCmd } from '../utils.js';
import { EventButton, EventScroll, EventKey } from 'gi-types/gdk3';
import { Command } from './constructor.js';
import Service from '../service.js';

interface Params {
    onChange?: Command
    value?: number
    min?: number
    max?: number
    step?: number
}

export default class AgsSlider extends Gtk.Scale {
    static {
        GObject.registerClass({
            GTypeName: 'AgsSlider',
            Properties: {
                'dragging': Service.pspec('dragging', 'boolean', 'r'),
                'vertical': Service.pspec('vertical', 'boolean', 'rw'),
            },
        }, this);
    }

    onChange: Command;

    constructor({
        onChange = '',
        value = 0,
        min = 0,
        max = 1,
        step = 0.01,
        ...rest
    }: Params = {}) {
        super({
            ...rest,
            adjustment: new Gtk.Adjustment({
                lower: min,
                upper: max,
                stepIncrement: step,
            }),
        });

        this.onChange = onChange;

        this.adjustment.connect('notify::value', ({ value }, event) => {
            if (!this.dragging)
                return;

            typeof this.onChange === 'function'
                ? this.onChange(this, event, value)
                : runCmd((onChange as string).replace(/\{\}/g, value));
        });

        if (value)
            this.value = value;
    }

    get value() { return this.adjustment.value; }
    set value(value: number) {
        if (this.dragging)
            return;

        this.adjustment.value = value;
    }

    get min() { return this.adjustment.lower; }
    set min(min: number) { this.adjustment.lower = min; }

    get max() { return this.adjustment.upper; }
    set max(max: number) { this.adjustment.upper = max; }

    get step() { return this.adjustment.stepIncrement; }
    set step(step: number) { this.adjustment.stepIncrement = step; }

    // @ts-expect-error
    get dragging() { return this._dragging; }
    set dragging(dragging: boolean) {
        // @ts-expect-error
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

    vfunc_key_press_event(event: EventKey): boolean {
        this.dragging = true;
        return super.vfunc_key_press_event(event);
    }

    vfunc_key_release_event(event: EventKey): boolean {
        this.dragging = false;
        return super.vfunc_key_release_event(event);
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
