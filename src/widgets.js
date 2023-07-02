import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import Widget from './widget.js';
import { typecheck, error, runCmd, restcheck, warning, getConfig } from './utils.js';

function _orientation(str) {
    if (str === 'v')
        str = 'vertical';

    if (str === 'h')
        str = 'horizontal';

    try {
        return Gtk.Orientation[str.toUpperCase()];
    } catch (error) {
        warning('wrong orientation value');
    }

    return Gtk.Orientation.HORIZONTAL;
}

export function Box({ type, orientation, homogeneous, children, ...rest } = {}) {
    orientation ||= 'horizontal';
    homogeneous ||= false;
    children ||= [];
    typecheck('orientation', orientation, 'string', type);
    typecheck('homogeneous', homogeneous, 'boolean', type);
    typecheck('children', children, 'array', type);
    restcheck(rest, type);

    const box = new Gtk.Box({
        orientation: _orientation(orientation),
        homogeneous,
    });

    children.forEach(w => box.add(Widget(w)));

    return box;
}

export function EventBox({ type,
    onClick = '', onSecondaryClick = '', onMiddleClick = '',
    onHover = '', onHoverLost = '',
    onScrollUp = '', onScrollDown = '',
    child, ...rest
}) {
    typecheck('onClick', onClick, ['string', 'function'], type);
    typecheck('onSecondaryClick', onSecondaryClick, ['string', 'function'], type);
    typecheck('onMiddleClick', onMiddleClick, ['string', 'function'], type);
    typecheck('onHover', onHover, ['string', 'function'], type);
    typecheck('onHoverLost', onHoverLost, ['string', 'function'], type);
    typecheck('onScrollUp', onScrollUp, ['string', 'function'], type);
    typecheck('onScrollDown', onScrollDown, ['string', 'function'], type);
    restcheck(rest, type);

    const box = new Gtk.EventBox();

    box.connect('enter-notify-event', () => {
        box.set_state_flags(Gtk.StateFlags.PRELIGHT, false);
        runCmd(onHover, box);
    });

    box.connect('leave-notify-event', () => {
        box.unset_state_flags(Gtk.StateFlags.PRELIGHT);
        runCmd(onHoverLost, box);
    });

    box.connect('button-press-event', (box, e) => {
        box.set_state_flags(Gtk.StateFlags.ACTIVE, false);
        switch (e.get_button()[1]) {
        case 1: runCmd(onClick, box); break;
        case 2: runCmd(onMiddleClick, box); break;
        case 3: runCmd(onSecondaryClick, box); break;
        default:
            break;
        }
    });

    box.connect('button-release-event', () =>
        box.unset_state_flags(Gtk.StateFlags.ACTIVE));

    if (onScrollUp || onScrollDown) {
        box.add_events(Gdk.EventMask.SCROLL_MASK);
        box.connect('scroll-event', (_w, event) => {
            if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.UP)
                runCmd(onScrollUp, box);
            else if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.DOWN)
                runCmd(onScrollDown, box);
        });
    }

    if (child)
        box.add(Widget(child));

    return box;
}

export function CenterBox({ type, children, ...props } = {}) {
    children ||= [];
    typecheck('children', children, 'array', type);

    if (children.length !== 3)
        error(`${type} should have exactly 3 children!`);

    const box = Box({ type, ...props });

    box.pack_start(Widget(children[0]), true, true, 0);
    box.set_center_widget(Widget(children[1]));
    box.pack_end(Widget(children[2]), true, true, 0);

    return box;
}

export function Icon({ type, icon, size, ...rest } = {}) {
    icon ||= '';
    size ||= getConfig()?.baseIconSize || 16;
    typecheck('icon', icon, 'string', type);
    typecheck('icon', size, 'number', type);
    restcheck(rest, type);

    const img = Gtk.Image.new_from_icon_name(icon || '', 1);
    img.pixel_size = size;
    return img;
}

export function Label({ type, label, markup, wrap, angle, justify, xalign, yalign, ...rest } = {}) {
    label ||= '';
    markup ||= false;
    wrap ||= false;
    angle ||= 0;
    justify ||= 'center';
    xalign ||= xalign === 0 ? 0 : 0.5;
    yalign ||= yalign === 0 ? 0 : 0.5;
    typecheck('label', label, 'string', type);
    typecheck('markup', markup || false, 'boolean', type);
    typecheck('wrap', wrap || false, 'boolean', type);
    typecheck('angle', angle || 0, 'number', type);
    typecheck('justify', justify || '', 'string', type);
    typecheck('xalign', xalign, 'number', type);
    typecheck('yalign', yalign, 'number', type);
    restcheck(rest, type);

    let _justify;
    try {
        _justify = Gtk.Justification[justify.toUpperCase()];
    } catch (error) {
        warning('wrong justify value');
    }

    const lbl = new Gtk.Label({
        label,
        angle,
        justify: _justify,
        use_markup: markup,
        wrap,
        xalign,
        yalign,
    });

    return lbl;
}

export function Button({ type, child, onClick, onSecondaryClick, onScrollUp, onScrollDown, ...rest } = {}) {
    onClick ||= '';
    onSecondaryClick ||= '';
    onScrollUp ||= '';
    onScrollDown ||= '';
    typecheck('onClick', onClick, ['string', 'function'], type);
    typecheck('onSecondaryClick', onSecondaryClick, ['string', 'function'], type);
    typecheck('onScrollUp', onScrollUp, ['string', 'function'], type);
    typecheck('onScrollDown', onScrollDown, ['string', 'function'], type);
    restcheck(rest, type);

    const btn = new Gtk.Button();

    if (child)
        btn.add(Widget(child));

    btn.connect('clicked', () => runCmd(onClick, btn));
    btn.connect('button-press-event', (_w, event) => {
        if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
            runCmd(onSecondaryClick, btn);
    });

    if (onScrollUp || onScrollDown) {
        btn.add_events(Gdk.EventMask.SCROLL_MASK);
        btn.connect('scroll-event', (_w, event) => {
            if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.UP)
                runCmd(onScrollUp, btn);
            else if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.DOWN)
                runCmd(onScrollDown, btn);
        });
    }

    return btn;
}

export function Slider({ type, inverted, orientation, min, max, value, onChange, drawValue, ...rest } = {}) {
    inverted ||= false;
    orientation ||= 'horizontal';
    min ||= 0;
    max ||= 1;
    value ||= 0;
    onChange ||= '';
    drawValue ||= false;
    typecheck('inverted', inverted, 'boolean', type);
    typecheck('orientation', orientation, 'string', type);
    typecheck('min', min, 'number', type);
    typecheck('max', max, 'number', type);
    typecheck('onChange', onChange, ['string', 'function'], type);
    typecheck('value', value, 'number', type);
    typecheck('drawValue', drawValue, 'boolean', type);
    restcheck(rest, type);

    const slider = new Gtk.Scale({
        orientation: _orientation(orientation),
        adjustment: new Gtk.Adjustment({
            value: min,
            lower: min,
            upper: max,
            step_increment: (max-min) /100,
        }),
        draw_value: drawValue,
        inverted: inverted,
    });

    slider.connect('button-press-event', () => { slider._dragging = true; });
    slider.connect('button-release-event', () => { slider._dragging = false; });

    slider.connect('scroll-event', (_w, event) => {
        const { adjustment } = slider;
        const [,, y] = event.get_scroll_deltas();

        slider._dragging = true;
        y > 0
            ? adjustment.value -= adjustment.step_increment
            : adjustment.value += adjustment.step_increment;

        slider._dragging = false;
    });

    if (onChange) {
        slider.adjustment.connect('notify::value', ({ value }) => {
            if (!slider._dragging)
                return;

            typeof onChange === 'function'
                ? onChange(value)
                : runCmd(onChange.replace(/\{\}/g, value), slider);
        });
    }

    return slider;
}

export function Dynamic({ type, items, ...rest } = {}) {
    items ||= [];
    typecheck('items', items, 'array', type);
    restcheck(rest, type);

    const children = items.map(({ value, widget }) => {
        if (!widget)
            return null;

        const w = Widget(widget);
        w._value = value;
        w.hide();
        return w;
    }).filter(item => item !== null);

    const box = Box({ children });
    box.update = condition => {
        box.hide();
        for (const item of children)
            item.hide();

        for (const item of children) {
            if (condition(item._value)) {
                box.show();
                item.show();
                return;
            }
        }
    };

    return box;
}

export function Entry({ type, text, placeholder, onChange, onAccept, password, ...rest }) {
    placeholder ||= '';
    text ||= '';
    onChange ||= '';
    onAccept ||= '';
    password ||= false;
    typecheck('text', text, 'string', type);
    typecheck('placeholder', placeholder, 'string', type);
    typecheck('onChange', onChange, ['string', 'function'], type);
    typecheck('onAccept', onAccept, ['string', 'function'], type);
    typecheck('password', password, 'boolean', type);
    restcheck(rest, type);

    const entry = new Gtk.Entry({
        placeholder_text: placeholder,
        visibility: !password,
        text,
    });

    if (onAccept) {
        entry.connect('activate', () => {
            typeof onAccept === 'function'
                ? onAccept(entry.text)
                : runCmd(onAccept.replace(/\{\}/g, entry.text), entry);
        });
    }

    if (onChange) {
        entry.connect('notify::text', () => {
            typeof onAccept === 'function'
                ? onChange(entry.text)
                : runCmd(onChange.replace(/\{\}/g, entry.text), entry);
        });
    }

    return entry;
}

export function Scrollable({ type, child, hscroll, vscroll, ...rest }) {
    hscroll ||= 'automatic';
    vscroll ||= 'automatic';
    typecheck('hscroll', hscroll, 'string', type);
    typecheck('vscroll', vscroll, 'string', type);
    restcheck(rest, type);

    const scrollable = new Gtk.ScrolledWindow({
        hadjustment: new Gtk.Adjustment(),
        vadjustment: new Gtk.Adjustment(),
    });
    scrollable.set_policy(
        Gtk.PolicyType[hscroll.toUpperCase()],
        Gtk.PolicyType[vscroll.toUpperCase()],
    );

    if (child)
        scrollable.add(Widget(child));

    return scrollable;
}

export function Revealer({ type, transition, duration, child, ...rest }) {
    transition ||= 'crossfade';
    duration ||= 300;
    typecheck('transition', transition, 'string', type);
    typecheck('duration', duration, 'number', type);
    restcheck(rest, type);

    let transitionType;
    try {
        transitionType = Gtk.RevealerTransitionType[transition.toUpperCase()];
    } catch (error) {
        logError(error);
    }

    const revealer = new Gtk.Revealer({
        transition_type: transitionType,
        transition_duration: duration,
    });

    if (child)
        revealer.add(Widget(child));

    return revealer;
}

export function Overlay({ type, children = [], ...rest }) {
    restcheck(rest, type);

    const overlay = new Gtk.Overlay();

    if (children[0]) {
        overlay.add(Widget(children[0]));
        children.splice(1).forEach(ch => overlay.add_overlay(Widget(ch)));
    }

    return overlay;
}

export function ProgressBar({ type, value, inverted, orientation, ...rest }) {
    inverted ||= false;
    orientation ||= 'horizontal';
    value ||= 0;
    typecheck('inverted', inverted, 'boolean', type);
    typecheck('orientation', orientation, 'string', type);
    typecheck('value', value, 'number', type);
    restcheck(rest, type);

    const bar = new Gtk.ProgressBar({
        orientation: _orientation(orientation),
        inverted,
    });

    bar.setValue = v => bar.set_fraction(v);
    bar.setValue(value);
    return bar;
}
