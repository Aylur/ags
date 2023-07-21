// importing
const { Hyprland, Notifications, Mpris, Audio, Battery } = ags.Service;
const { exec, CONFIG_DIR } = ags.Utils;

const workspaces = {
    type: 'box',
    className: 'workspaces',
    // box is an instance of Gtk.Box
    connections: [[Hyprland, box => {
        // remove every children
        box.get_children().forEach(ch => ch.destroy());

        // add a button for each workspace
        const workspaces = 10;
        for (let i = 1; i <= workspaces; ++i) {
            box.add(ags.Widget({
                type: 'button',
                onClick: () => execAsync(`hyprctl dispatch workspace ${i}`),
                child: i.toString(),
                className: Hyprland.active.workspace.id == i ? 'focused' : '',
            }));
        }

        // make the box render it
        box.show_all();
    }]],
};

const clientTitle = {
    type: 'label',
    className: 'client-title',
    // label is an instance of Gtk.Label
    connections: [[Hyprland, label => {
        label.label = Hyprland.active.client.title || '';
    }]],
};

const clock = {
    type: 'label',
    className: 'clock',
    // trim is for the whitespace at the end of the date output
    // but doing this is actually bad practice
    // because exec() will block the main thread, but in case of runnig date
    // I don't think it matters
    connections: [[1000, label => label.label = exec('date "+%H:%M:%S %b %e."').trim()]],
};

// we don't need dunst or any other notification daemon
// because ags has a notification daemon built in
const notification = {
    type: 'box',
    className: 'notification',
    children: [
        {
            type: 'icon',
            icon: 'preferences-system-notifications-symbolic',
            // icon is an instance of Gtk.Image
            connections: [[Notifications, icon => icon.visible = Notifications.popups.size > 0]]
        },
        {
            type: 'label',
            connections: [[Notifications, label => {
                // notifications is a map, to get the last elememnt lets make an array
                label.label = Array.from(Notifications.popups)?.pop()?.[1].summary || '';
            }]],
        },
    ],
};

const media = {
    type: 'label',
    className: 'media',
    connections: [[Mpris, label => {
        const mpris = Mpris.getPlayer('');
        if (mpris)
            label.label = `${mpris.trackArtists.join(', ')} - ${mpris.trackTitle}`;
        else
            label.label = 'Nothing is playing';
    }]],
};

const volume = {
    type: 'box',
    className: 'volume',
    style: 'min-width: 180px',
    children: [
        {
            type: 'dynamic',
            items: [
                { value: 101, widget: { type: 'icon', icon: 'audio-volume-overamplified-symbolic' } },
                { value: 67, widget: { type: 'icon', icon: 'audio-volume-high-symbolic' } },
                { value: 34, widget: { type: 'icon', icon: 'audio-volume-medium-symbolic' } },
                { value: 1, widget: { type: 'icon', icon: 'audio-volume-low-symbolic' } },
                { value: 0, widget: { type: 'icon', icon: 'audio-volume-muted-symbolic' } },
            ],
            // dynamic is a Gtk.Box with an extra update method
            connections: [[Audio, dynamic => dynamic.update(value => {
                if (!Audio.speaker)
                    return;

                if (Audio.speaker.isMuted)
                    return value === 0;

                return value <= (Audio.speaker.volume*100);
            }), 'speaker-changed']],
        },
        {
            type: 'slider',
            hexpand: true,
            onChange: value => Audio.speaker.volume = value,
            connections: [[Audio, slider => {
                if (!Audio.speaker)
                    return;

                slider.adjustment.value = Audio.speaker.volume;
            }, 'speaker-changed']],
        }
    ],
};

const battery = {
    type: 'box',
    className: 'battery',
    children: [
        {
            type: 'icon',
            connections: [[Battery, icon => {
                // icon is an instance of Gtk.Image
                icon.icon_name = `battery-level-${Math.floor(Battery.percent/10)*10}-symbolic`;
            }]]
        },
        {
            type: 'progressbar',
            valign: 'center',
            // progressbar is a Gtk.ProgressBar, setValue() just calls set_fraction()
            connections: [[Battery, progress => progress.setValue(Battery.percent/100)]],
        },
    ],
};

// layout of the bar
const left = {
    type: 'box',
    children: [
        workspaces,
        clientTitle,
    ],
};

const center = {
    type: 'box',
    className: 'center',
    children: [
        media,
        notification,
    ],
};

const right = {
    type: 'box',
    className: 'right',
    halign: 'end',
    children: [
        volume,
        battery,
        clock,
    ],
};

const bar = {
    name: 'bar',
    anchor: ['top', 'left', 'right'],
    exclusive: true,
    child: {
        type: 'centerbox',
        children: [
            left,
            center,
            right,
        ],
    },
}

// exporting the config
var config = {
    style: CONFIG_DIR+'/style.css',
    windows: [bar],
};
