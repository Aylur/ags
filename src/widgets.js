import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';
import Widget from './widget.js';
import { typecheck, runCmd, restcheck, warning, getConfig } from './utils.js';

function _orientation(str = 'horizontal') {
    if (str === 'v')
        str = 'vertical';

    if (str === 'h')
        str = 'horizontal';

    const orientation = Gtk.Orientation[str.toUpperCase()];
    if (typeof orientation !== 'number')
        warning('wrong orientation value');

    return orientation;
}

export function Box({
    type,
    orientation = 'horizontal',
    homogeneous = false,
    children = [],
    ...rest
}) {
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

export function EventBox({
    type,
    onClick = '',
    onSecondaryClick = '',
    onMiddleClick = '',
    onClickRelease = '',
    onSecondaryClickRelease = '',
    onMiddleClickRelease = '',
    onHover = '',
    onHoverLost = '',
    onScrollUp = '',
    onScrollDown = '',
    child, ...rest
}) {
    typecheck('onClick', onClick, ['string', 'function'], type);
    typecheck('onSecondaryClick', onSecondaryClick, ['string', 'function'], type);
    typecheck('onMiddleClick', onMiddleClick, ['string', 'function'], type);
    typecheck('onClickRelease', onClickRelease, ['string', 'function'], type);
    typecheck('onMiddleClickRelease', onMiddleClickRelease, ['string', 'function'], type);
    typecheck('onSecondaryClickRelease', onSecondaryClickRelease, ['string', 'function'], type);
    typecheck('onHover', onHover, ['string', 'function'], type);
    typecheck('onHoverLost', onHoverLost, ['string', 'function'], type);
    typecheck('onScrollUp', onScrollUp, ['string', 'function'], type);
    typecheck('onScrollDown', onScrollDown, ['string', 'function'], type);
    restcheck(rest, type);

    const box = new Gtk.EventBox();

    box.connect('enter-notify-event', (box, event) => {
        box.set_state_flags(Gtk.StateFlags.PRELIGHT, false);
        runCmd(onHover, box, event);
    });

    box.connect('leave-notify-event', (box, event) => {
        box.unset_state_flags(Gtk.StateFlags.PRELIGHT);
        runCmd(onHoverLost, box, event);
    });

    box.connect('button-press-event', (box, event) => {
        box.set_state_flags(Gtk.StateFlags.ACTIVE, false);
        if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
            runCmd(onClick, box, event);

        else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
            runCmd(onSecondaryClick, box, event);

        else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
            runCmd(onMiddleClick, box, event);
    });

    box.connect('button-release-event', (box, event) => {
        box.unset_state_flags(Gtk.StateFlags.ACTIVE);
        if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
            runCmd(onClickRelease, box, event);

        else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
            runCmd(onSecondaryClickRelease, box, event);

        else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
            runCmd(onMiddleClickRelease, box, event);
    });

    if (onScrollUp || onScrollDown) {
        box.add_events(Gdk.EventMask.SCROLL_MASK);
        box.connect('scroll-event', (box, event) => {
            if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.UP)
                runCmd(onScrollUp, box, event);
            else if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.DOWN)
                runCmd(onScrollDown, box, event);
        });
    }

    if (child)
        box.add(Widget(child));

    return box;
}

export function CenterBox({ type, children = [], ...props }) {
    typecheck('children', children, 'array', type);

    if (children.length !== 3)
        warning(`${type} should have exactly 3 children!`);

    const box = Box({ type, ...props });

    box.pack_start(Widget(children[0]), true, true, 0);
    box.set_center_widget(Widget(children[1]));
    box.pack_end(Widget(children[2]), true, true, 0);

    return box;
}

export function Icon({
    type,
    icon = '',
    size = getConfig()?.baseIconSize || 16,
    ...rest
}) {
    typecheck('icon', icon, 'string', type);
    typecheck('icon', size, 'number', type);
    restcheck(rest, type);

    return GLib.file_test(icon, GLib.FileTest.EXISTS)
        ? Gtk.Image.new_from_pixbuf(
            GdkPixbuf.Pixbuf.new_from_file_at_size(icon, size, size),
        )
        : new Gtk.Image({
            icon_name: icon,
            icon_size: 1,
            pixel_size: size,
        });
}

export function Label({
    type,
    label = '',
    markup = false,
    ellipsize = false,
    wrap = false,
    maxWidth = -1,
    angle = 0,
    justify = 'center',
    xalign = 0.5,
    yalign = 0.5,
    ...rest
}) {
    typecheck('label', label, 'string', type);
    typecheck('markup', markup || false, 'boolean', type);
    typecheck('ellipsize', ellipsize || false, 'boolean', type);
    typecheck('wrap', wrap || false, 'boolean', type);
    typecheck('angle', angle || 0, 'number', type);
    typecheck('justify', justify || '', 'string', type);
    typecheck('xalign', xalign, 'number', type);
    typecheck('yalign', yalign, 'number', type);
    restcheck(rest, type);

    const _justify = Gtk.Justification[justify.toUpperCase()];
    if (typeof _justify !== 'number')
        warning('wrong justify value');

    const lbl = new Gtk.Label({
        label,
        angle,
        justify: _justify,
        ellipsize: ellipsize ? 3 : 0, // this is ellipsize mode END to turn it on
        use_markup: markup,
        max_width_chars: maxWidth,
        wrap,
        xalign,
        yalign,
    });

    return lbl;
}

export function Button({
    type,
    child,
    onClick = '',
    onMiddleClick = '',
    onSecondaryClick = '',
    onClickRelease = '',
    onMiddleClickRelease = '',
    onSecondaryClickRelease = '',
    onScrollUp = '',
    onScrollDown = '',
    ...rest
}) {
    typecheck('onClick', onClick, ['string', 'function'], type);
    typecheck('onMiddleClick', onMiddleClick, ['string', 'function'], type);
    typecheck('onSecondaryClick', onSecondaryClick, ['string', 'function'], type);
    typecheck('onClickRelease', onClickRelease, ['string', 'function'], type);
    typecheck('onMiddleClickRelease', onMiddleClickRelease, ['string', 'function'], type);
    typecheck('onSecondaryClick', onSecondaryClickRelease, ['string', 'function'], type);
    typecheck('onScrollUp', onScrollUp, ['string', 'function'], type);
    typecheck('onScrollDown', onScrollDown, ['string', 'function'], type);
    restcheck(rest, type);

    const btn = new Gtk.Button();

    if (child)
        btn.add(Widget(child));

    btn.connect('button-press-event', (btn, event) => {
        if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
            runCmd(onClick, btn, event);

        else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
            runCmd(onSecondaryClick, btn, event);

        else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
            runCmd(onMiddleClick, btn, event);
    });

    btn.connect('button-release-event', (btn, event) => {
        if (event.get_button()[1] === Gdk.BUTTON_PRIMARY)
            runCmd(onClickRelease, btn, event);

        else if (event.get_button()[1] === Gdk.BUTTON_SECONDARY)
            runCmd(onSecondaryClickRelease, btn, event);

        else if (event.get_button()[1] === Gdk.BUTTON_MIDDLE)
            runCmd(onMiddleClickRelease, btn, event);
    });

    if (onScrollUp || onScrollDown) {
        btn.add_events(Gdk.EventMask.SCROLL_MASK);
        btn.connect('scroll-event', (btn, event) => {
            if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.UP)
                runCmd(onScrollUp, btn, event);

            else if (event.get_scroll_direction()[1] === Gdk.ScrollDirection.DOWN)
                runCmd(onScrollDown, btn, event);
        });
    }

    return btn;
}

export function Slider({
    type,
    inverted = false,
    orientation = 'horizontal',
    min = 0,
    max = 1,
    value = 0,
    onChange = '',
    drawValue = false,
    ...rest
}) {
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
            step_increment: (max - min) / 100,
        }),
        draw_value: drawValue,
        inverted: inverted,
    });

    slider.connect('button-press-event', () => { slider._dragging = true; });
    slider.connect('button-release-event', () => { slider._dragging = false; });

    slider.connect('scroll-event', ({ adjustment }, event) => {
        const [, , y] = event.get_scroll_deltas();

        slider._dragging = true;
        y > 0
            ? adjustment.value -= adjustment.step_increment
            : adjustment.value += adjustment.step_increment;

        slider._dragging = false;
    });

    if (onChange) {
        slider.adjustment.connect('notify::value', ({ value }, event) => {
            if (!slider._dragging)
                return;

            typeof onChange === 'function'
                ? onChange(slider, event, value)
                : runCmd(onChange.replace(/\{\}/g, value));
        });
    }

    return slider;
}

export function Dynamic({ type, items = [], ...rest } = {}) {
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

export function Stack({
    type,
    items = [],
    hhomogeneous = true,
    vhomogeneous = true,
    interpolateSize = false,
    transition = 'none',
    transitionDuration = 200,
    ...rest
}) {
    typecheck('hhomogeneous', hhomogeneous, 'boolean', type);
    typecheck('vhomogeneous', vhomogeneous, 'boolean', type);
    typecheck('interpolateSize', interpolateSize, 'boolean', type);
    typecheck('transition', transition, 'string', type);
    typecheck('transitionDuration', transitionDuration, 'number', type);
    typecheck('items', items, 'array', type);
    restcheck(rest, type);

    const transitionType = Gtk.StackTransitionType[transition.toUpperCase()];
    if (typeof transitionType !== 'number')
        warning('wrong transition value');

    const stack = new Gtk.Stack({
        hhomogeneous,
        vhomogeneous,
        interpolateSize,
        transitionDuration,
        transitionType,
    });

    items.forEach(([name, widget]) => {
        if (widget)
            stack.add_named(Widget(widget), name);
    });

    stack.showChild = name => {
        const n = typeof name === 'function' ? name() : name;
        stack.visible = true;
        stack.get_child_by_name(n)
            ? stack.set_visible_child_name(n)
            : stack.visible = false;
    };
    return stack;
}

export function Entry({
    type,
    text = '',
    placeholder = '',
    onChange = '',
    onAccept = '',
    password = false,
    ...rest
}) {
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
        entry.connect('activate', ({ text }, event) => {
            typeof onAccept === 'function'
                ? onAccept(entry, event, text)
                : runCmd(onAccept.replace(/\{\}/g, text));
        });
    }

    if (onChange) {
        entry.connect('notify::text', ({ text }, event) => {
            typeof onAccept === 'function'
                ? onChange(entry, event, text)
                : runCmd(onChange.replace(/\{\}/g, text));
        });
    }

    return entry;
}

export function Scrollable({
    type,
    child,
    hscroll = 'automatic',
    vscroll = 'automatic',
    ...rest
}) {
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

export function Revealer({
    type,
    transition = 'crossfade',
    duration = 250,
    revealChild = false,
    child,
    ...rest
}) {
    typecheck('transition', transition, 'string', type);
    typecheck('duration', duration, 'number', type);
    typecheck('revealChild', revealChild, 'boolean', type);
    restcheck(rest, type);

    const transitionType = Gtk.RevealerTransitionType[transition.toUpperCase()];
    if (typeof transitionType !== 'number')
        warning('wrong transition type');

    const revealer = new Gtk.Revealer({
        transitionType,
        revealChild,
        transitionDuration: duration,
    });

    if (child)
        revealer.add(Widget(child));

    return revealer;
}

export function Overlay({ type, children = [], passthrough = true, ...rest }) {
    typecheck('passthrough', passthrough, 'boolean', type);
    typecheck('children', children, 'array', type);
    restcheck(rest, type);

    const overlay = new Gtk.Overlay();

    if (children[0]) {
        overlay.add(Widget(children[0]));
        children.splice(1).forEach(ch => overlay.add_overlay(Widget(ch)));
    }

    if (passthrough)
        overlay.get_children().forEach(ch => overlay.set_overlay_pass_through(ch, true));

    return overlay;
}

export function ProgressBar({
    type,
    value = 0,
    inverted = false,
    orientation = 'horizontal',
    ...rest
}) {
    typecheck('inverted', inverted, 'boolean', type);
    typecheck('orientation', orientation, 'string', type);
    typecheck('value', value, 'number', type);
    restcheck(rest, type);

    const bar = new Gtk.ProgressBar({
        orientation: _orientation(orientation),
        inverted,
        fraction: value,
    });

    bar.setValue = v => bar.set_fraction(v);
    return bar;
}

export function Switch({
    type,
    active = false,
    onActivate = '',
    ...rest
}) {
    typecheck('active', active, 'boolean', type);
    typecheck('onActivate', onActivate, ['string', 'function'], type);
    restcheck(rest, type);

    const gtkswitch = new Gtk.Switch({ active });
    if (onActivate) {
        gtkswitch.connect('notify::active', ({ active }, event) => {
            typeof onActivate === 'function'
                ? onActivate(gtkswitch, event, active)
                : runCmd(onActivate.replace(/\{\}/g, active));
        });
    }

    return gtkswitch;
}

export function Popover({
    type,
    child,
    modal = true,
    position = 'bottom',
    pointingTo,
    relativeTo,
    ...rest
}) {
    typecheck('position', position, 'string', type);
    typecheck('modal', modal, 'boolean', type);
    typecheck('pointingTo', pointingTo, ['undefined', 'object'], type);
    restcheck(rest, type);

    const _position = Gtk.PositionType[position.toUpperCase()];
    if (typeof _position !== 'number')
        warning('wrong position value');

    const popover = new Gtk.Popover({
        position: _position,
        modal,
    });

    if (child)
        popover.add(Widget(child));

    if (pointingTo)
        popover.set_pointing_to(new Gdk.Rectangle(pointingTo));

    if (relativeTo)
        popover.set_relative_to(relativeTo);

    return popover;
}

export function MenuButton({
    type,
    child,
    popover,
    popup,
    onToggled = '',
    ...rest
}) {
    typecheck('onToggled', onToggled, ['string', 'function'], type);
    restcheck(rest, type);

    const button = new Gtk.MenuButton({
        use_popover: true,
    });

    if (onToggled)
        button.connect('toggled', (...args) => runCmd(onToggled, ...args));

    if (popover)
        button.set_popover(Widget(popover));

    if (popup)
        button.set_popup(Widget(popup));

    if (child)
        button.add(Widget(child));

    return button;
}

export function Menu({
    type,
    children = [],
    yOffset = 0,
    xOffset = 0,
    onPopup = '',
    onMoveScroll = '',
    attachTo,
    ...rest
}) {
    typecheck('children', children, 'array', type);
    typecheck('yOffset', yOffset, 'number', type);
    typecheck('xOffset', xOffset, 'number', type);
    typecheck('onPopup', onPopup, ['string', 'function'], type);
    typecheck('onMoveScroll', onMoveScroll, ['string', 'function'], type);
    restcheck(rest, type);

    const menu = new Gtk.Menu({
        rect_anchor_dx: xOffset,
        rect_anchor_dy: yOffset,
    });

    children.forEach(item => {
        menu.add(Widget(item));
    });

    if (attachTo)
        menu.attach_widget = attachTo;

    if (onPopup)
        menu.connect('popped-up', (...args) => runCmd(onPopup, ...args));

    if (onMoveScroll)
        menu.connect('move-scroll', (...args) => runCmd(onMoveScroll, ...args));

    menu.show_all();
    menu.hide();
    return menu;
}

export function MenutItem({
    type,
    child,
    submenu,
    onActivate = '',
    onSelect = '',
    onDeselect = '',
    ...rest
}) {
    typecheck('onActivate', onActivate, ['string', 'function'], type);
    typecheck('onSelect', onSelect, ['string', 'function'], type);
    typecheck('onDeselect', onDeselect, ['string', 'function'], type);
    restcheck(rest, type);

    const item = new Gtk.MenuItem();

    if (child)
        item.add(Widget(child));

    if (submenu)
        item.submenu = Widget(submenu);

    [[onActivate, 'activate'], [onSelect, 'select'], [onDeselect, 'deselect']]
        .forEach(([handler, signal]) => {
            if (handler)
                item.connect(signal, (...args) => runCmd(handler, ...args));
        });

    return item;
}
