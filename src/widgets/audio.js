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
        widget._id = widget[stream].connect('changed', callback);
        callback();
    });
}

export function SpeakerIndicator({ items, ...rest }) {
    items ||= [
        { value: 101, widget: { type: 'icon', icon: 'audio-volume-overamplified-symbolic' } },
        { value: 67, widget: { type: 'icon', icon: 'audio-volume-high-symbolic' } },
        { value: 34, widget: { type: 'icon', icon: 'audio-volume-medium-symbolic' } },
        { value: 1, widget: { type: 'icon', icon: 'audio-volume-low-symbolic' } },
        { value: 0, widget: { type: 'icon', icon: 'audio-volume-muted-symbolic' } },
    ];
    const dynamic = Dynamic({ items, ...rest });
    _connectStream({
        stream: 'speaker',
        widget: dynamic,
        callback: () => dynamic.update(value => value <= Audio.speaker.volume),
    });

    return dynamic;
}

export function SpeakerLabel(props) {
    const label = Label(props);
    _connectStream({
        stream: 'speaker',
        widget: label,
        callback: () => { label.label = `${Math.floor(Audio.speaker.volume)}`; },
    });
    return label;
}

export function SpeakerSlider(props) {
    const slider = Slider(props);
    slider.connect('value-changed', ({ adjustment: { value } }) => {
        if (!slider._dragging)
            return;

        Audio.speaker.volume = value;
    });

    const update = () => {
        if (slider._dragging)
            return;

        slider.adjustment.value = Audio.speaker.volume;
    };
    _connectStream({
        stream: 'speaker',
        widget: slider,
        callback: update,
    });
    return slider;
}

export function MicMuteIndicator({
    muted = Icon({ icon: 'microphone-disabled-symbolic' }),
    unmuted = Icon({ icon: 'microphone-sensitivity-high-symbolic' }),
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: true, widget: muted },
            { value: false, widget: unmuted },
        ],
    });

    _connectStream({
        stream: 'microphone',
        widget: dynamic,
        callback: () => dynamic.update(value => value === Audio.microphone?.isMuted),
    });

    return dynamic;
}

export function MicMuteToggle(props) {
    const button = Button({
        ...props,
        onClick: () => {
            if (!Audio.microphone)
                return;

            Audio.microphone.isMuted = !Audio.microphone.isMuted;
        },
    });
    _connectStream({
        stream: 'microphone',
        widget: button,
        callback: () => {
            if (!Audio.microphone)
                return;

            Audio.microphone.isMuted
                ? button.get_style_context().add_class('on')
                : button.get_style_context().remove_class('on');
        },
    });
    return button;
}
