import App from '../app.js';
import Applications from '../service/apps.js';
import Widget from '../widget.js';
import { Box, Icon, Scrollable } from './basic.js';
import { restcheck, typecheck } from '../utils.js';

const _item = ({ name, description, iconName, launch }, window) => {
    const title = Widget({
        className: 'title',
        type: 'label',
        label: name,
        xalign: 0,
        valign: 'center',
    });
    const desc = Widget({
        className: 'description',
        type: 'label',
        label: description,
        wrap: true,
        xalign: 0,
        justify: 'left',
        valign: 'center',
    });
    const ico = Icon({
        icon: iconName,
        size: 38,
    });
    const btn = Widget({
        className: 'app',
        type: 'button',
        child: Box({
            children: [
                ico,
                Box({
                    orientation: 'vertical',
                    children: [title, desc],
                }),
            ],
        }),
        onClick: () => {
            App.toggleWindow(window);
            launch();
        },
    });
    return btn;
};

const _listbox = () => {
    const box = Box({
        orientation: 'vertical',
    });
    box.push = item => {
        box.add(item);
        box.show_all();
    };
    box.clear = () => {
        box.get_children().forEach(ch => ch.destroy());
        box.show_all();
    };
    return box;
};

const _layout = ({ entry, listbox }) => {
    return Box({
        orientation: 'vertical',
        children: [
            entry,
            Scrollable({
                hscroll: 'never',
                child: listbox,
            }),
        ],
    });
};

export function AppLauncher({ type, placeholder, layout, item, listbox, window, ...rest }) {
    layout ||= _layout;
    item ||= _item;
    listbox ||= _listbox;
    typecheck('layout', layout, 'function', type);
    typecheck('item', item, 'function', type);
    typecheck('listbox', listbox, 'function', type);
    typecheck('window', window, 'string', type);
    restcheck(rest, type);

    const appsbox = listbox();

    const onAccept = search => {
        const list = Applications.query(search);
        if (list[0]) {
            App.toggleWindow('app-launcher');
            list[0].launch();
        }
    };

    const update = search => {
        const list = Applications.query(search);

        appsbox.clear();
        list.forEach(app => {
            appsbox.push(item(app, window));
        });
    };
    update();

    const entry = Widget({
        type: 'entry',
        hexpand: true,
        placeholder,
        onAccept,
        onChange: update,
    });

    const box = layout({
        entry,
        listbox: appsbox,
    });

    App.connect('window-toggled', (_app, name) => {
        if (name !== window)
            return;

        entry.set_text('');
        if (App.getWindow(name).visible)
            box.grab_focus();
    });

    return box;
}
