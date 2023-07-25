import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';
import { restcheck, typecheck, warning } from './utils.js';
import Widget from './widget.js';
import App from './app.js';
import { setStyle, toggleClassName } from './widget.js';

imports.gi.versions.GtkLayerShell = '0.1';
const { GtkLayerShell: GtkLayerShell } = imports.gi;

export interface Window {
    anchor?: string[]
    child?: { type: string } | Gtk.Widget | null
    className?: string
    exclusive?: boolean
    focusable?: boolean
    layer?: string
    margin?: number[] | number
    monitor?: number
    name?: string
    popup?: boolean
    style?: string
    visible?: boolean
    setup?: (win: Gtk.Window) => void,
}

export default function Window({
    name = 'gtk-layer-shell',
    anchor = [],
    margin = [],
    layer = 'top',
    exclusive = false,
    popup = false,
    focusable = false,
    child = null,
    className = '',
    style = '',
    monitor,
    visible = true,
    setup,
    ...rest
}: Window): Gtk.Window {
    typecheck('name', name, 'string', 'window');
    typecheck('anchor', anchor, 'array', 'window');
    typecheck('margin', margin, ['number', 'array'], 'window');
    typecheck('layer', layer, 'string', 'window');
    typecheck('exclusive', exclusive, 'boolean', 'window');
    typecheck('popup', popup, 'boolean', 'window');
    typecheck('focusable', focusable, 'boolean', 'window');
    typecheck('className', className, 'string', 'window');
    typecheck('monitor', monitor, ['number', 'undefined'], 'window');
    restcheck(rest, `window: ${name}`);

    const win = new Gtk.Window({ name });
    GtkLayerShell.init_for_window(win);
    GtkLayerShell.set_namespace(win, name);

    // @ts-ignore
    win.setStyle = (css: string) => setStyle(win, css);

    // @ts-ignore
    win.toggleClassName = (className: string, condition) => toggleClassName(win, className, condition);

    if (anchor) {
        anchor.forEach(side => GtkLayerShell
            .set_anchor(
                win,
                GtkLayerShell.Edge[side.toUpperCase()],
                true,
            ),
        );
    }

    if (margin) {
        let margins: [side: string, index: number][] = [];
        if (typeof margin === 'number')
            margin = [margin];

        switch (margin.length) {
        case 1:
            margins = [['TOP', 0], ['RIGHT', 0], ['BOTTOM', 0], ['LEFT', 0]];
            break;
        case 2:
            margins = [['TOP', 0], ['RIGHT', 1], ['BOTTOM', 0], ['LEFT', 1]];
            break;
        case 3:
            margins = [['TOP', 0], ['RIGHT', 1], ['BOTTOM', 2], ['LEFT', 1]];
            break;
        case 4:
            margins = [['TOP', 0], ['RIGHT', 1], ['BOTTOM', 2], ['LEFT', 3]];
            break;
        default:
            break;
        }

        margins.forEach(([side, i]) =>
            GtkLayerShell.set_margin(win, GtkLayerShell.Edge[side], (margin as number[])[i]),
        );
    }

    GtkLayerShell.set_layer(win, GtkLayerShell.Layer[layer?.toUpperCase()]);

    if (exclusive)
        GtkLayerShell.auto_exclusive_zone_enable(win);

    if (typeof monitor === 'number') {
        const display = Gdk.Display.get_default();
        display
            ? GtkLayerShell.set_monitor(win, display.get_monitor(monitor))
            : warning(`Could not find monitor with id: ${monitor}`);
    }

    if (className) {
        className.split(' ').forEach(cn => {
            win.get_style_context().add_class(cn);
        });
    }

    if (style)
        setStyle(win, style);

    if (child)
        win.add(Widget(child));

    if (popup) {
        win.connect('key-press-event', (_, event) => {
            if (event.get_keyval()[1] === Gdk.KEY_Escape)
                App.getWindow(name) ? App.closeWindow(name) : win.hide();
        });

        visible = false;
    }

    if (focusable)
        GtkLayerShell.set_keyboard_mode(win, GtkLayerShell.KeyboardMode.ON_DEMAND);

    win.show_all();
    if (typeof visible === 'boolean')
        win.visible = visible;

    if (setup)
        setup(win);

    return win;
}
