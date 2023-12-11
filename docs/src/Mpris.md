> [!NOTE]
> dependency: `gvfs` for cover art caching
>
> NixOS: `services.gvfs`

## signals
* `changed`: emits on any state change except position change
* `player-changed`: `(busName: string)`
* `player-closed`: `(busName: string)`
* `player-added`: `(busName: string)`

## properties
* `players`: `Player[]` see below

## methods
* `getPlayer`: `(string) => Player` returns Player that has given string in its busName

## Player

### signals
* `position`: `(positon: number)` this is signaled when the position is set explicitly
* `closed`

### properties
* `bus-name`: `string` the dbus name that starts with `org.mpris.MediaPlayer2`
* `name`: `string` stripped from busName like `spotify` or `firefox`
* `identity`: `string` name of the player like `Spotify` or `Mozilla Firefox`
* `entry`: `string` .desktop entry without the extension
* `trackid`: `string`
* `track-artists`: `string[]` list of artists
* `track-title`: `string`
* `track-cover-url`: `string` url to the cover art
* `cover-path`: `string` path to the cached cover art
* `play-back-status`: `"Playing" | "Paused" | "Stopped"`
* `can-go-next`: `boolean`
* `can-go-prev`: `boolean`
* `can-play`: `boolean`
* `shuffle-status`: `boolean | null` null if shuffle is unsupported by the player
* `loop-status`: `"None" | "Track" | "Playlist" | null` null if shuffle is unsupported by the player
* `volume`: `number`
* `length`: `number`
* `position`: `number`

### methods
* `playPause`: `() => void`
* `play`: `() => void`
* `stop`: `() => void`
* `next`: `() => void`
* `previous`: `() => void`
* `shuffle`: `() => void`
* `loop`: `() => void`

## Example Widget
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';

const currentlyPlaying = Widget.Button({
    onClicked: () => Mpris.players[0]?.playPause(),
    child: Widget.Label(),
    visible: false,
    connections: [[Mpris, self => {
        const player = Mpris.players[0];
        self.visible = player;
        if (!player)
            return;

        const { trackArtists, trackTitle } = player;
        self.child.label = `${trackArtists.join(', ')} - ${trackTitle}`;
    }]],
});
```
