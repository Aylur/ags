import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import Applications from 'resource:///com/github/Aylur/ags/service/applications.js';

const WINDOW_NAME = 'applauncher';

/** @param {import('resource:///com/github/Aylur/ags/service/applications.js').Application} app */
const AppItem = app => Widget.Button({
    on_clicked: () => {
        App.closeWindow(WINDOW_NAME);
        app.launch();
    },
    setup: self => self.app = app,
    child: Widget.Box({
        children: [
            Widget.Icon({
                icon: app.icon_name || '',
                size: 42,
            }),
            Widget.Box({
                vertical: true,
                vpack: 'center',
                children: [
                    Widget.Label({
                        class_name: 'title',
                        label: app.name,
                        xalign: 0,
                        vpack: 'center',
                        truncate: 'end',
                    }),
                    // short circuit if there is no description
                    !!app.description && Widget.Label({
                        class_name: 'description',
                        label: app.description || '',
                        wrap: true,
                        xalign: 0,
                        justification: 'left',
                        vpack: 'center',
                    }),
                ],
            }),
        ],
    }),
});

const Applauncher = ({ width = 500, height = 500, spacing = 12 } = {}) => {
    const list = Widget.Box({
        vertical: true,
        spacing,
    });

    const entry = Widget.Entry({
        hexpand: true,
        css: `margin-bottom: ${spacing}px;`,

        // set some text so on-change works the first time
        text: '-',

        // to launch the first item on Enter
        on_accept: ({ text }) => {
            const list = Applications.query(text || '');
            if (list[0]) {
                App.toggleWindow(WINDOW_NAME);
                list[0].launch();
            }
        },

        // filter out the list
        on_change: ({ text }) => list.children.map(item => {
            item.visible = item.app.match(text);
        }),
    });

    return Widget.Box({
        vertical: true,
        css: `margin: ${spacing * 2}px;`,
        children: [
            entry,

            // wrap the list in a scrollable
            Widget.Scrollable({
                hscroll: 'never',
                css: `
                    min-width: ${width}px;
                    min-height: ${height}px;
                `,
                child: list,
            }),
        ],

        // make entry.text empty on launch
        // and update the list's children so it is sorted by frequency
        connections: [[App, (_, name, visible) => {
            if (name !== WINDOW_NAME)
                return;

            list.children = Applications.list.map(AppItem);

            entry.text = '';
            if (visible)
                entry.grab_focus();
        }]],
    });
};

const applauncher = Widget.Window({
    name: WINDOW_NAME,
    popup: true,
    visible: false,
    focusable: true,
    child: Applauncher({
        width: 500,
        height: 500,
        spacing: 12,
    }),
});

export default {
    windows: [applauncher],
};
