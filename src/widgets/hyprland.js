import { Box, Icon, Label } from './basic.js';
import Hyprland from '../service/hyprland.js';
import Widget from '../widget.js';
import { typecheck, error, warning } from '../utils.js';
import { lookUpIcon } from '../utils.js';
import Applications from '../service/apps.js';

export function Workpsaces({ type, monitors, fixed, active, empty, occupied, ...props }) {
    typecheck('monitors', monitors || [], 'array', type);
    typecheck('fixed', fixed || 0, 'number', type);

    const box = Box({ type, ...props });
    if (!monitors && !fixed) {
        error(`${type} needs either "fixed" or "monitors" to be defined`);
        return box;
    }

    const button = (windows, i) => {
        const { active: { workspace }, workspaces } = Hyprland;

        const [child, className] = workspace.id === i
            ? [active, 'active']
            : windows > 0
                ? [occupied, 'occupied']
                : [empty, 'empty'];

        return Widget({
            type: 'button',
            onClick: () => Hyprland.Hyprctl(`dispatch workspace ${i}`),
            className,
            child: child ? Widget(child) : `${workspaces.get(i)?.name || i}`,
        });
    };

    const forFixed = () => {
        box.get_children().forEach(ch => ch.destroy());
        const { workspaces } = Hyprland;
        for (let i=1; i<fixed+1; ++i) {
            if (workspaces.has(i)) {
                const { windows } = workspaces.get(i);
                box.add(button(windows, i));
            } else {
                box.add(button(0, i));
            }
        }
    };

    const forMonitors = () => {
        box.get_children().forEach(ch => ch.destroy());
        const { workspaces, monitors } = Hyprland;
        workspaces.forEach(({ id, windows, monitor }) => {
            if (!monitors.includes(monitors.get(monitor).name)
                && !monitors.includes(monitors.get(monitor).id))
                return;

            box.add(button(windows, id));
        });
    };

    Hyprland.connect(box, () => {
        fixed ? forFixed() : forMonitors();
        box.show_all();
    });

    return box;
}

export function WindowLabel({ type, show, substitutes, fallback, ...props }) {
    show ||= 'title';
    substitutes ||= [];
    fallback ||= '';
    typecheck('show', show, 'string', type);
    typecheck('substitutes', substitutes, 'array', type);
    typecheck('fallback', fallback, 'string', type);

    if (show === 'title' || show === 'class') {
        const label = Label({ type, ...props });
        Hyprland.connect(label, () => {
            let name = Hyprland.active.client[show] || '';
            substitutes.forEach(({ from, to }) => {
                if (name === from)
                    name = to;
            });
            label.label = name;
        });
        return label;
    }

    warning(`show has to be "class" or "title" on ${type}`);
    return Label();
}

export function WindowIcon({ type, symbolic, substitutes, fallback, ...rest }) {
    symbolic ||= false;
    substitutes ||= [];
    typecheck('substitutes', substitutes, 'array', type);
    typecheck('symbolic', symbolic, 'boolean', type);
    typecheck('fallback', fallback, ['string', 'undefined'], type);

    const icon = Icon({ type, ...rest });
    Hyprland.connect(icon, () => {
        let classIcon = `${Hyprland.active.client.class}${symbolic ? '-symbolic' : ''}`;
        let titleIcon = `${Hyprland.active.client.title}${symbolic ? '-symbolic' : ''}`;
        substitutes.forEach(({ from, to }) => {
            if (classIcon === from)
                classIcon = to;

            if (titleIcon === from)
                titleIcon = to;
        });

        const hasTitleIcon = lookUpIcon(titleIcon);
        const hasClassIcon = lookUpIcon(classIcon);

        if (fallback)
            icon.icon_name = fallback;

        if (hasClassIcon)
            icon.icon_name = classIcon;

        if (hasTitleIcon)
            icon.icon_name = titleIcon;

        icon.visible = fallback || hasTitleIcon || hasClassIcon;
    });

    return icon;
}

const _item = ({ iconName }, { address, title }) => ({
    type: 'button',
    child: { type: 'icon', icon: iconName },
    tooltip: title,
    className: Hyprland.active.client.address === address.substring(2) ? 'focused' : 'nonfocused',
    onClick: () => Hyprland.Hyprctl(`dispatch focuswindow address:${address}`),
});

export function Taskbar({ type, item, ...props }) {
    item ||= _item;
    typecheck('item', item, 'function', type);

    const box = Box({ type, ...props });

    let apps;
    const update = () => {
        apps = Applications.query('');
    };
    Applications.connect(box, update);
    Hyprland.connect(box, () => {
        box.get_children().forEach(ch => ch.destroy());
        Hyprland.clients.forEach(client => {
            for (const app of apps) {
                if (client.title && app.match(client.title) || client.class && app.match(client.class)) {
                    box.add(Widget(item(app, client)));
                    return;
                }
            }
        });
        box.show_all();
    });

    return box;
}
