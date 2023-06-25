import Audio from '../service/audio.js';
import { Button, Dynamic, Icon, Label, Slider } from './basic.js';

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
        callback: dynamic => dynamic.update(value => value <= Audio.speaker.volume),
    });
};

export const SpeakerLabel = props => _connectStream({
    stream: 'speaker',
    widget: Label(props),
    callback: label => label.label = `${Math.floor(Audio.speaker.volume)}`,
});

export const SpeakerSlider = props => _connectStream({
    stream: 'speaker',
    widget: Slider({
        onChange: value => Audio.speaker.volume = value,
        ...props,
    }),
    callback: slider => slider.adjustment.value = Audio.speaker.volume,
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
