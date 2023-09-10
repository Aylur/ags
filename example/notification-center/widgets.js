import { Notification } from './notification.js';
const { Gtk } = imports.gi;
const { Notifications } = ags.Service;
const { Scrollable, Box, Icon, Label, Widget, Button, Stack } = ags.Widget;

const List = () => Box({
    vertical: true,
    vexpand: true,
    connections: [[Notifications, box => {
        box.children = Notifications.notifications
            .reverse()
            .map(n => Notification(n));

        box.visible = Notifications.notifications.length > 0;
    }]],
});

const Placeholder = () => Box({
    className: 'placeholder',
    vertical: true,
    vexpand: true,
    valign: 'center',
    children: [
        Icon('notifications-disabled-symbolic'),
        Label('Your inbox is empty'),
    ],
    connections: [
        [Notifications, box => {
            box.visible = Notifications.notifications.length === 0;
        }],
    ],
});

export const NotificationList = () => Scrollable({
    hscroll: 'never',
    vscroll: 'automatic',
    child: Box({
        className: 'list',
        vertical: true,
        children: [
            List(),
            Placeholder(),
        ],
    }),
});

export const ClearButton = () => Button({
    onClicked: Notifications.clear,
    connections: [[Notifications, button => {
        button.sensitive = Notifications.notifications.length > 0;
    }]],
    child: Box({
        children: [
            Label('Clear'),
            Stack({
                items: [
                    ['true', Icon('user-trash-full-symbolic')],
                    ['false', Icon('user-trash-symbolic')],
                ],
                connections: [[Notifications, stack => {
                    stack.shown = `${Notifications.notifications.length > 0}`;
                }]],
            }),
        ],
    }),
});

export const DNDSwitch = () => Widget({
    type: Gtk.Switch,
    valign: 'center',
    connections: [
        ['notify::active', ({ active }) => {
            Notifications.dnd = active;
        }],
    ],
});

export const PopupList = () => Box({
    className: 'list',
    style: 'padding: 1px;', // so it shows up
    vertical: true,
    connections: [[Notifications, box => {
        box.children = Array.from(Notifications.popups.values())
            .map(n => Notification(n));
    }]],
});
