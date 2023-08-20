const { Notifications } = ags.Service;
const { lookUpIcon, timeout } = ags.Utils;
const { Box, Icon, Label, EventBox, Button } = ags.Widget;

const NotificationIcon = ({ appEntry, appIcon, image }) => {
    if (image) {
        return Box({
            valign: 'start',
            hexpand: false,
            className: 'icon img',
            style: `
                background-image: url("${image}");
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                min-width: 78px;
                min-height: 78px;
            `,
        });
    }

    let icon = 'dialog-information-symbolic';
    if (lookUpIcon(appIcon))
        icon = appIcon;

    if (lookUpIcon(appEntry))
        icon = appEntry;

    return Box({
        valign: 'start',
        hexpand: false,
        className: 'icon',
        style: `
            min-width: 78px;
            min-height: 78px;
        `,
        children: [Icon({
            icon, size: 58,
            halign: 'center', hexpand: true,
            valign: 'center', vexpand: true,
        })],
    });
};

export const Notification = ({ id, summary, body, actions, urgency, ...icon }) => EventBox({
    className: `notification ${urgency}`,
    onPrimaryClick: () => Notifications.dismiss(id),
    properties: [['hovered', false]],
    onHover: w => {
        if (w._hovered)
            return;

        // if there are action buttons and they are hovered
        // EventBox onHoverLost will fire off immediately,
        // so to prevent this we delay it
        timeout(300, () => w._hovered = true);
    },
    onHoverLost: w => {
        if (!w._hovered)
            return;

        w._hovered = false;
        Notifications.dismiss(id);
    },
    vexpand: false,
    child: Box({
        vertical: true,
        children: [
            Box({
                children: [
                    NotificationIcon(icon),
                    Box({
                        hexpand: true,
                        vertical: true,
                        children: [
                            Box({
                                children: [
                                    Label({
                                        className: 'title',
                                        xalign: 0,
                                        justification: 'left',
                                        hexpand: true,
                                        maxWidthChars: 24,
                                        truncate: 'end',
                                        wrap: true,
                                        label: summary,
                                        useMarkup: summary.startsWith('<'),
                                    }),
                                    Button({
                                        className: 'close-button',
                                        valign: 'start',
                                        child: Icon('window-close-symbolic'),
                                        onClicked: () => Notifications.close(id),
                                    }),
                                ],
                            }),
                            Label({
                                className: 'description',
                                hexpand: true,
                                useMarkup: true,
                                xalign: 0,
                                justification: 'left',
                                label: body,
                                wrap: true,
                            }),
                        ],
                    }),
                ],
            }),
            Box({
                className: 'actions',
                children: actions.map(action => Button({
                    className: 'action-button',
                    onClicked: () => Notifications.invoke(id, action.id),
                    hexpand: true,
                    child: Label(action.label),
                })),
            }),
        ],
    }),
});
