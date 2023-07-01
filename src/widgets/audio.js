import Widget from '../widget.js';
import Audio from '../service/audio.js';
import Gtk from 'gi://Gtk?version=3.0';
import { Box, Button, Dynamic, Icon, Label, Slider } from './basic.js';
import { error } from '../utils.js';

function _connectStream({ stream, widget, callback }) {
    Audio.connect(widget, () => {
        if (widget[stream] === Audio[stream])
            return;

        const disconnect = () => {
            if (widget._id) {
                widget[stream].disconnect(widget._id);
                widget._id = null;
            }
        };
        widget.connect('destroy', disconnect);
        disconnect();

        widget[stream] = Audio[stream];
        widget._id = widget[stream].connect('changed', () => callback(widget));
        callback(widget);
    });
    return widget;
}

export const SpeakerIndicator = ({ items, ...rest }) => {
    items ||= [
        { value: 101, widget: { type: 'icon', icon: 'audio-volume-overamplified-symbolic' } },
        { value: 67, widget: { type: 'icon', icon: 'audio-volume-high-symbolic' } },
        { value: 34, widget: { type: 'icon', icon: 'audio-volume-medium-symbolic' } },
        { value: 1, widget: { type: 'icon', icon: 'audio-volume-low-symbolic' } },
        { value: 0, widget: { type: 'icon', icon: 'audio-volume-muted-symbolic' } },
    ];
    return _connectStream({
        stream: 'speaker',
        widget: Dynamic({ items, ...rest }),
        callback: dynamic => dynamic.update(value => {
            if (Audio.speaker.isMuted)
                return value === 0;

            return value <= (Audio.speaker.volume*100);
        }),
    });
};

export const SpeakerLabel = props => _connectStream({
    stream: 'speaker',
    widget: Label(props),
    callback: label => label.label = `${Math.floor(Audio.speaker.volume*100)}`,
});

export const SpeakerSlider = props => _connectStream({
    stream: 'speaker',
    widget: Slider({
        onChange: value => Audio.speaker.volume = value,
        ...props,
    }),
    callback: slider => {
        slider.adjustment.value = Audio.speaker.volume;
        slider.sensitive = !Audio.speaker.isMuted;
    },
});

export const MicMuteIndicator = ({
    muted = Icon({ icon: 'microphone-disabled-symbolic' }),
    unmuted = Icon({ icon: 'microphone-sensitivity-high-symbolic' }),
    ...rest
}) => _connectStream({
    stream: 'microphone',
    widget: Dynamic({
        ...rest,
        items: [
            { value: true, widget: muted },
            { value: false, widget: unmuted },
        ],
    }),
    callback: dynamic => dynamic.update(value => value === Audio.microphone?.isMuted),
});

export const MicMuteToggle = props => _connectStream({
    stream: 'microphone',
    widget: Button({
        ...props,
        onClick: () => {
            if (!Audio.microphone)
                return;

            Audio.microphone.isMuted = !Audio.microphone.isMuted;
        },
    }),
    callback: button => {
        if (!Audio.microphone)
            return;

        button.toggleClassName(Audio.microphone.isMuted, 'on');
    },
});

export function AppMixer({ item, ...props }) {
    item ||= stream => {
        const icon = Icon();
        const label = Label({ xalign: 0, justify: 'left', wrap: true });
        const percent = Label({ xalign: 1 });
        const slider = Widget({
            type: 'slider',
            hexpand: true,
            onChange: value => stream.volume = value,
        });
        const box = Widget({
            type: 'box',
            hexpand: true,
            children: [
                icon,
                Widget({
                    type: 'box',
                    hexpand: true,
                    orientation: 'vertical',
                    children: [
                        label,
                        {
                            type: 'box',
                            children: [
                                slider,
                                percent,
                            ],
                        },
                    ],
                }),
            ],
        });
        box.update = () => {
            icon.icon_name = stream.iconName;
            icon.set_tooltip_text(stream.name);
            slider.set_value(stream.volume);
            percent.label = `${Math.floor(stream.volume*100)}%`;
            stream.description.length > 37
                ? label.label = stream.description.substring(0, 37)+'..'
                : label.label = stream.description;
        };
        return box;
    };

    const box = Box({ orientation: 'vertical', ...props });
    Audio.connect(box, () => {
        box.get_children().forEach(ch => ch.destroy());
        for (const [, stream] of Audio.apps) {
            const app = item(stream);
            if (!(app instanceof Gtk.Widget) || typeof app.update !== 'function')
                error('App Mixer item needs return a Gtk.Widget and has to have an update function');

            box.add(app);
            const id1 = stream.connect('changed', () => app.update());
            const id2 = stream.connect('closed', () => stream.disconnect(id1));
            app.connect('destroy', () => {
                stream.disconnect(id1);
                stream.disconnect(id2);
            });
            app.update();
        }

        box.show_all();
    });
    return box;
}
