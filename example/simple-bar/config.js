const hyprland = await Service.import('hyprland');
const notifications = await Service.import('notifications');
const mpris = await Service.import('mpris');
const audio = await Service.import('audio');
const battery = await Service.import('battery');
const systemtray = await Service.import('systemtray');

const date = Variable('', {
    poll: [1000, 'date "+%H:%M:%S %b %e."'],
});

// widgets can be only assigned as a child in one container
// so to make a reuseable widget, make it a function
// then you can simply instantiate one by calling it

function Workspaces() {
    const workspaces = hyprland.bind('workspaces');
    const activeId = hyprland.active.workspace.bind('id');
    return Widget.Box({
        class_name: 'workspaces',
        children: workspaces.as(ws => ws.map(({ id }) => Widget.Button({
            on_clicked: () => hyprland.messageAsync(`dispatch workspace ${id}`),
            child: Widget.Label(`${id}`),
            class_name: activeId.as(i => `${i === id ? 'focused' : ''}`),
        }))),
    });
}

const ClientTitle = () => Widget.Label({
    class_name: 'client-title',
    label: hyprland.active.client.bind('title'),
});

const Clock = () => Widget.Label({
    class_name: 'clock',
    label: date.bind(),
});

// we don't need dunst or any other notification daemon
// because the Notifications module is a notification daemon itself
function Notification() {
    const popups = notifications.bind('popups');
    return Widget.Box({
        class_name: 'notification',
        visible: popups.as(p => p.length > 0),
        children: [
            Widget.Icon({
                icon: 'preferences-system-notifications-symbolic',
            }),
            Widget.Label({
                label: popups.as(p => p[0]?.summary || ''),
            }),
        ],
    });
}

const Media = () => Widget.Button({
    class_name: 'media',
    on_primary_click: () => mpris.getPlayer('')?.playPause(),
    on_scroll_up: () => mpris.getPlayer('')?.next(),
    on_scroll_down: () => mpris.getPlayer('')?.previous(),
    child: Widget.Label('-').hook(mpris, self => {
        if (mpris.players[0]) {
            const { track_artists, track_title } = mpris.players[0];
            self.label = `${track_artists.join(', ')} - ${track_title}`;
        } else {
            self.label = 'Nothing is playing';
        }
    }, 'player-changed'),
});

const Volume = () => Widget.Box({
    class_name: 'volume',
    css: 'min-width: 180px',
    children: [
        Widget.Icon().hook(audio.speaker, self => {
            const category = {
                101: 'overamplified',
                67: 'high',
                34: 'medium',
                1: 'low',
                0: 'muted',
            };

            const icon = audio.speaker.is_muted ? 0 : [101, 67, 34, 1, 0].find(
                threshold => threshold <= audio.speaker.volume * 100);

            self.icon = `audio-volume-${category[icon]}-symbolic`;
        }),
        Widget.Slider({
            hexpand: true,
            draw_value: false,
            on_change: ({ value }) => audio.speaker.volume = value,
            setup: self => self.hook(audio.speaker, () => {
                self.value = audio.speaker.volume || 0;
            }),
        }),
    ],
});

const BatteryLabel = () => Widget.Box({
    class_name: 'battery',
    visible: battery.bind('available'),
    children: [
        Widget.Icon({
            icon: battery.bind('percent').as(p =>
                `battery-level-${Math.floor(p / 10) * 10}-symbolic`,
            ),
        }),
        Widget.ProgressBar({
            vpack: 'center',
            fraction: battery.bind('percent').as(p =>
                p > 0 ? p / 100 : 0,
            ),
        }),
    ],
});

const SysTray = () => Widget.Box({
    children: systemtray.bind('items').as(items =>
        items.map(item => Widget.Button({
            child: Widget.Icon({ icon: item.bind('icon') }),
            on_primary_click: (_, event) => item.activate(event),
            on_secondary_click: (_, event) => item.openMenu(event),
            tooltip_markup: item.bind('tooltip_markup'),
        })),
    ),
});

// layout of the bar
const Left = () => Widget.Box({
    spacing: 8,
    children: [
        Workspaces(),
        ClientTitle(),
    ],
});

const Center = () => Widget.Box({
    spacing: 8,
    children: [
        Media(),
        Notification(),
    ],
});

const Right = () => Widget.Box({
    hpack: 'end',
    spacing: 8,
    children: [
        Volume(),
        BatteryLabel(),
        Clock(),
        SysTray(),
    ],
});

const Bar = (monitor = 0) => Widget.Window({
    name: `bar-${monitor}`, // name has to be unique
    class_name: 'bar',
    monitor,
    anchor: ['top', 'left', 'right'],
    exclusivity: 'exclusive',
    child: Widget.CenterBox({
        start_widget: Left(),
        center_widget: Center(),
        end_widget: Right(),
    }),
});

// exporting the config so ags can manage the windows
export default {
    style: './style.css',
    windows: [
        Bar(),

        // you can call it, for each monitor
        // Bar(0),
        // Bar(1)
    ],
};
