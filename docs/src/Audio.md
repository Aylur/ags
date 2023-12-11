## signals
* `speaker-changed` default speaker's state changed
* `microphone-changed` default microphone' state changed
* `stream-added`: `(id: number)` new stream appeared
* `stream-rmoved`: `(id: number)` stream disappeared

## properties
* `control`: [Gvc.MixerControl](https://gjs-docs.gnome.org/gvc10~1.0/gvc.mixercontrol)
* `speaker`: `Stream` writable
* `microphone`: `Stream` writable
* `apps`: `Stream[]` list of streams filtered by sink inputs
* `recorders`: `Stream[]` list of streams filtered by source outputs
* `speakers`: `Stream[]` list of streams filtered by sinks
* `microphones`: `Stream[]` list of streams filtered by sources

## methods
* `getStream`: `(id: number) => Stream`

### Stream
* `stream` [Gvc.MixerStream](https://gjs-docs.gnome.org/gvc10~1.0/gvc.mixerstream) the wrapped stream object
* `name`: `string`
* `application_id`: `string|null`
* `description`: `string|null`
* `icon-name`: `string`
* `id`: `number`
* `is-muted`: `boolean` this returns if volume is 0, setting this to true sets volume to 0. If you want the actual `is-muted`, you can use `Stream.stream.isMuted`
* `volume`: `number`: writable, between 0 and 1

## Example Widgets

### Volume Slider
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';

const VolumeSlider = (type = 'speaker') => Widget.Slider({
    hexpand: true,
    drawValue: false,
    onChange: ({ value }) => Audio[type].volume = value,
    connections: [[Audio, self => {
        // Audio.speaker and Audio.microphone can be undefined
        // to workaround this use the ? chain operator
        self.value = Audio[type]?.volume || 0;
    }, `${type}-changed`]],
});

const speakerSlider = VolumeSlider('speaker');
const micSlider = VolumeSlider('microphone');
```

### Indicator Icon
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';

const volumeIndicator = Widget.Button({
    onClicked: () => Audio.speaker.isMuted = !Audio.speaker.isMuted,
    child: Widget.Icon({
        connections: [[Audio, self => {
            if (!Audio.speaker)
                return;

            const vol = Audio.speaker.volume * 100;
            const icon = [
                [101, 'overamplified'],
                [67,  'high'],
                [34,  'medium'],
                [1,   'low'],
                [0,   'muted'],
            ].find(([threshold]) => threshold <= vol)[1];

            self.icon = `audio-volume-${icon}-symbolic`;
            self.tooltipText = `Volume ${Math.floor(vol)}%`;
        }, 'speaker-changed']],
    }),
});
```
