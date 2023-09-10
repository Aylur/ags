const { Window, Box, Label, EventBox } = ags.Widget;
import {
    NotificationList, DNDSwitch, ClearButton, PopupList,
} from './widgets.js';

const Header = () => Box({
    className: 'header',
    children: [
        Label('Do Not Disturb'),
        DNDSwitch(),
        Box({ hexpand: true }),
        ClearButton(),
    ],
});

const NotificationCenter = () => Window({
    name: 'notification-center',
    anchor: 'right top bottom',
    popup: true,
    focusable: true,
    child: Box({
        children: [
            EventBox({
                hexpand: true,
                connections: [['button-press-event', () =>
                    ags.App.closeWindow('notification-center')]]
            }),
            Box({
                vertical: true,
                children: [
                    Header(),
                    NotificationList(),
                ],
            }),
        ],
    }),
});

const NotificationsPopupWindow = () => Window({
    name: 'popup-window',
    anchor: 'top',
    child: PopupList(),
});

ags.Utils.timeout(1000, () => ags.Utils.execAsync([
    'notify-send',
    'Notification Center example',
    'To have the panel popup run "ags toggle-window notification-center"' +
    '\nPress ESC to close it.',
]).catch(console.error));

export default {
    style: ags.App.configDir + '/style.css',
    windows: [
        NotificationsPopupWindow(),
        NotificationCenter(),
    ]
}
