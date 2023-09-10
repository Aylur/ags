// importing 
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Notifications from 'resource:///com/github/Aylur/ags/service/notifications.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Stack, Label, Icon, CenterBox, Window, Slider, ProgressBar } = Widget;

// widgets can be only assigned as a child in one container
// so to make a reuseable widget, just make it a function
// then you can use it by calling simply calling it

const Workspaces = () => Box({
    className: 'workspaces',
    connections: [[Hyprland, box => {
        // generate an array [1..10] then make buttons from the index
        const arr = Array.from({ length: 10 }, (_, i) => i + 1);
        box.children = arr.map(i => Button({
            onClicked: () => execAsync(`hyprctl dispatch workspace ${i}`),
            child: Label({ label: `${i}` }),
            className: Hyprland.active.workspace.id == i ? 'focused' : '',
        }));
    }]],
});

const ClientTitle = () => Label({
    className: 'client-title',
    // an initial label value can be given but its pointless
    // because callbacks from connections are run on construction
    // so in this case this is redundant
    label: Hyprland.active.client.title || '',
    connections: [[Hyprland, label => {
        label.label = Hyprland.active.client.title || '';
    }]],
});

const Clock = () => Label({
    className: 'clock',
    connections: [
        // this is bad practice, since exec() will block the main event loop
        // in the case of a simple date its not really a problem
        [1000, label => label.label = exec('date "+%H:%M:%S %b %e."')],

        // this is what you should do
        [1000, label => execAsync(['date', '+%H:%M:%S %b %e.'])
            .then(date => label.label = date).catch(console.error)],
    ],
});

// we don't need dunst or any other notification daemon
// because ags has a notification daemon built in
const Notification = () => Box({
    className: 'notification',
    children: [
        Icon({
            icon: 'preferences-system-notifications-symbolic',
            connections: [
                [Notifications, icon => icon.visible = Notifications.popups.length > 0],
            ],
        }),
        Label({
            connections: [[Notifications, label => {
                label.label = Notifications.popups[0]?.summary || '';
            }]],
        }),
    ],
});

const Media = () => Button({
    className: 'media',
    onPrimaryClick: () => Mpris.getPlayer('')?.playPause(),
    onScrollUp: () => Mpris.getPlayer('')?.next(),
    onScrollDown: () => Mpris.getPlayer('')?.previous(),
    child: Label({
        connections: [[Mpris, label => {
            const mpris = Mpris.getPlayer('');
            // mpris player can be undefined
            if (mpris)
                label.label = `${mpris.trackArtists.join(', ')} - ${mpris.trackTitle}`;
            else
                label.label = 'Nothing is playing';
        }]],
    }),
});

const Volume = () => Box({
    className: 'volume',
    style: 'min-width: 180px',
    children: [
        Stack({
            items: [
                // tuples of [string, Widget]
                ['101', Icon('audio-volume-overamplified-symbolic')],
                ['67', Icon('audio-volume-high-symbolic')],
                ['34', Icon('audio-volume-medium-symbolic')],
                ['1', Icon('audio-volume-low-symbolic')],
                ['0', Icon('audio-volume-muted-symbolic')],
            ],
            connections: [[Audio, stack => {
                if (!Audio.speaker)
                    return;

                if (Audio.speaker.isMuted) {
                    stack.shown = '0';
                    return;
                }

                const show = [101, 67, 34, 1, 0].find(
                    threshold => threshold <= Audio.speaker.volume * 100);

                stack.shown = `${show}`;
            }, 'speaker-changed']],
        }),
        Slider({
            hexpand: true,
            drawValue: false,
            onChange: ({ value }) => Audio.speaker.volume = value,
            connections: [[Audio, slider => {
                if (!Audio.speaker)
                    return;

                slider.value = Audio.speaker.volume;
            }, 'speaker-changed']],
        }),
    ],
});

const BatteryLabel = () => Box({
    className: 'battery',
    children: [
        Icon({
            connections: [[Battery, icon => {
                icon.icon = `battery-level-${Math.floor(Battery.percent / 10) * 10}-symbolic`;
            }]],
        }),
        ProgressBar({
            valign: 'center',
            connections: [[Battery, progress => {
                if (Battery.percent < 0)
                    return;

                progress.fraction = Battery.percent / 100;
            }]],
        }),
    ],
});

const SysTray = () => Box({
    connections: [[SystemTray, box => {
        box.children = SystemTray.items.map(item => Button({
            child: Icon(),
            onPrimaryClick: (_, event) => item.activate(event),
            onSecondaryClick: (_, event) => item.openMenu(event),
            connections: [[item, button => {
                button.child.icon = item.icon;
                button.tooltipMarkup = item.tooltipMarkup;
            }]],
        }));
    }]],
});

// layout of the bar
const Left = () => Box({
    children: [
        Workspaces(),
        ClientTitle(),
    ],
});

const Center = () => Box({
    children: [
        Media(),
        Notification(),
    ],
});

const Right = () => Box({
    halign: 'end',
    children: [
        Volume(),
        BatteryLabel(),
        Clock(),
        SysTray(),
    ],
});

const Bar = ({ monitor } = {}) => Window({
    name: `bar-${monitor}`, // name has to be unique
    className: 'bar',
    monitor,
    anchor: ['top', 'left', 'right'],
    exclusive: true,
    child: CenterBox({
        startWidget: Left(),
        centerWidget: Center(),
        endWidget: Right(),
    }),
})

// exporting the config so ags can manage the windows
export default {
    style: App.configDir + '/style.css',
    windows: [
        Bar(),

        // you can call it, for each monitor
        // Bar({ monitor: 0 }),
        // Bar({ monitor: 1 })
    ],
};
