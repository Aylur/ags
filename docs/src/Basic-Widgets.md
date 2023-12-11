Importing
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js'
```

You can also import individual widgets
```js
import { Label, Box } from 'resource:///com/github/Aylur/ags/widget.js'
```

The properties listed here are just the additional properties on top of their base Gtk.Widget classes. [Refer to the Gtk3 docs](https://gjs-docs.gnome.org/gtk30~3.0/) for the rest of them.
### Window
subclass of [Gtk.Window](https://gjs-docs.gnome.org/gtk30~3.0/gtk.window)

| Property | Type | Description |
|----------|------|-------------|
| child | Widget |
| name | string | Name of the window. This has to be unique, if you pass it in config. This will also be the name of the layer.
| anchor | string[] | Valid values are `"top"`, `"bottom"`, `"left"`, `"right"`. Anchor points of the window. Leave it empty to make it centered.
| exclusivity | string | Specify if the compositor should reserve space for the window automatically or how the window should interact with windows that do. Possible values: `exclusive` (space should be reserved), `normal` (the window should move if occluding another), `ignore` (the window should not be moved). Default: `normal`.
| focusable | boolean | Useful if you have an `entry` or other widgets that require user input.
| layer | string | Valid values are `"overlay"`, `"top"`, `"bottom"`, `"background"`. It is `"top"` by default.
| margins | number[] | Corresponds to CSS notation, e.g `[0, 6]` would have 0 margin on the top and bottom and would have 6 on the right and left.
| monitor | number | Which monitor to show the window on. If it is left undefined the window will show on the currently focused monitor.
| popup | boolean | Pressing `ESC` while the window has focus will close it.
```js
const window = Widget.Window({
    name: 'window-name',
    anchor: ['top', 'left', 'right'],
    exclusive: false,
    focusable: false,
    layer: 'top',
    margin: [0, 6],
    monitor: 0,
    child: Widget.Label('hello'),
});
```
### Box
subclass of [Gtk.Box](https://gjs-docs.gnome.org/gtk30~3.0/gtk.box)

| Property | Type | Description |
|----------|------|-------------|
| vertical | bool | setting `vertical: true` is the same as `orientation: 1` |
| children | Widget[] | List of child widgets.

```js
const box = Widget.Box({
    spacing: 8,
    homogeneous: false,
    vertical: false,

    // set children dynamically
    connections: [
        [SomeService, self => {
            self.children = [
                /* widgets */
            ]

            // or if you want to add one child
            self.add(/* widget */)
            self.show_all();
        }],
    ],
});
```

### Button
subclass of [Gtk.Button](https://gjs-docs.gnome.org/gtk30~3.0/gtk.button)

| Property | Type |
|----------|------|
| child | Widget
| on-clicked | `() => void`
| on-primary-click | `(event: Gdk.Event) => boolean`
| on-secondary-click | `(event: Gdk.Event) => boolean`
| on-middle-click | `(event: Gdk.Event) => boolean`
| on-primary-click-release | `(event: Gdk.Event) => boolean`
| on-secondary-click-release | `(event: Gdk.Event) => boolean`
| on-middle-click-release | `(event: Gdk.Event) => boolean`
| on-hover | `(event: Gdk.Event) => boolean`
| on-hover-lost | `(event: Gdk.Event) => boolean`
| on-scroll-up | `(event: Gdk.Event) => boolean`
| on-scroll-down | `(event: Gdk.Event) => boolean`

```js
const button = Widget.Button({
    child: Widget.Label('click me!'),
    on_primary_click: () => print('echo hello')
});
```

### CenterBox
subclass of Box

| Property | Type |
|----------|------|
| start-widget | Gtk.Widget |
| center-widget | Gtk.Widget |
| end-widget | Gtk.Widget |

```js
const centerBox = Widget.CenterBox({
    spacing: 8,
    vertical: false,
    start_widget: Widget.Label('left widget'),
    center_widget: Widget.Label('center widget'),
    end_widget: Widget.Label('right widget'),
})
```

### CircularProgress
subclass of [Gtk.Bin](https://gjs-docs.gnome.org/gtk30~3.0/gtk.bin)

| Property | Type | Description |
|----------|------|-------------|
| start-at | number | Number between 0 and 1, e.g 0.75 is the top
| inverted | boolean |
| rounded | boolean | Wether the progress bar should have rounded ends
| value | number | Number between 0 and 1

```js
const progress = Widget.CircularProgress({
    style:
        'min-width: 50px;' + // its size is min(min-height, min-width)
        'min-height: 50px;' +
        'font-size: 6px;' + // to set its thickness set font-size on it
        'margin: 4px;' + // you can set margin on it
        'background-color: #131313;' + // set its bg color
        'color: aqua;', // set its fg color
    connections: [[Battery, self => {
        self.value = Battery.percent / 100;
    }]],
    child: Widget.Icon({
        binds: [['icon', Battery, 'icon-name']],
    }),
    rounded: false,
    inverted: false,
    startAt: 0.75,
});
```

### Entry
subclass of [Gtk.Entry](https://gjs-docs.gnome.org/gtk30~3.0/gtk.entry)

| Property | Type |
|----------|------|
| on-change | `() => void`
| on-accept | `() => void`

```js
const entry = Widget.Entry({
    placeholder_text: 'type here',
    text: 'initial text',
    visibility: true, // set to false for passwords
    on_accept: ({ text }) => print(text),
});
```

### EventBox
subclass of [Gtk.EventBox](https://gjs-docs.gnome.org/gtk30~3.0/gtk.eventbox)

| Property | Type |
|----------|------|
| child | Widget |
| on-primary-click | `(event: Gdk.Event) => boolean`
| on-secondary-click | `(event: Gdk.Event) => boolean`
| on-middle-click | `(event: Gdk.Event) => boolean`
| on-primary-click-release | `(event: Gdk.Event) => boolean`
| on-secondary-click-release | `(event: Gdk.Event) => boolean`
| on-middle-click-release | `(event: Gdk.Event) => boolean`
| on-hover | `(event: Gdk.Event) => boolean`
| on-hover-lost | `(event: Gdk.Event) => boolean`
| on-scroll-up | `(event: Gdk.Event) => boolean`
| on-scroll-down | `(event: Gdk.Event) => boolean`

### Icon
subclass of [Gtk.Image](https://gjs-docs.gnome.org/gtk30~3.0/gtk.image)

| Property | Type | Description |
|----------|------|-------------|
| icon | string | Name of an icon or path to a file |
| size | number | Forced size |

```js
Widget.Icon({ icon: 'dialog-information-symbolic' })

// if you only want an icon, it can be shortened like this
Widget.Icon('dialog-information-symbolic')

// if you don't set a size, it will be computed from css font-size
Widget.Icon({
    icon: 'dialog-information-symbolic',
    style: 'font-size: 30px',
});

// NOTE:
// setting the icon dynamically has a flicker currently
// to fix it, use a forced size
Widget.Icon({
    icon: 'dialog-information-symbolic',
    size: 30,
});
```
### Label
subclass of [Gtk.Label](https://gjs-docs.gnome.org/gtk30~3.0/gtk.label)

| Property | Type | Description |
|----------|------|-------------|
| justification | string | Valid values are `"left"`, `"center"`, `"right"`, `"fill"`. Same as `justify` but represented as a string instead of enum. |
| truncate | string | Valid values are `"none"`, `"start"`, `"middle"`, `"end"`. Same as `ellipsize` but represented as a string instead of enum. |

```js
const label = Widget.Label({
    label: 'some text to show',
    justification: 'left',
    truncate: 'end',
    xalign: 0,
    max_width_chars: 24,
    wrap: true,
    use_markup: true,
});
```

### Overlay
subclass of [Gtk.Overlay](https://gjs-docs.gnome.org/gtk30~3.0/gtk.overlay)
Takes the size of its first child, then places subsequent children on top of each other and won't render them outside the container.

| Property | Type | Description|
|----------|------|------------|
| child | Widget | Child which will determine the size of the overlay
| overlays | Widget[] | Overlayed children
| pass-through | boolean | Whether the overlay childs should pass the input through

### ProgressBar
subclass of [Gtk.ProgressBar](https://gjs-docs.gnome.org/gtk30~3.0/gtk.progressbar)

| Property | Type | Description |
|----------|------|-------------|
| vertical | bool | Setting `vertical: true` is the same as `orientation: 1` |
| value | number | Same as `ProgressBar.fraction` |

### Revealer
subclass of [Gtk.Revealer](https://gjs-docs.gnome.org/gtk30~3.0/gtk.revealer)

| Property | Type | Description |
|----------|------|-------------|
| child | Widget | |
| transition | string | Valid values are `"none"`, `"crossfade"`, `"slide_left"`, `"slide_right"`, `"slide_down"`, `"slide_up"`. This is `transitionType` represented as a string instead of enum. |

```js
const revealer = Widget.Revealer({
    reveal_child: false,
    transition_duration: 1000,
    transition: 'slide_right',
    child: Widget.Label('hello!'),
    connections: [[2000, self => {
        self.reveal_child = !self.reveal_child;
    }]],
});
```

### Scrollable
subclass of [Gtk.ScrolledWindow](https://gjs-docs.gnome.org/gtk30~3.0/gtk.scrolledwindow)

| Property | Type | Description |
|----------|------|-------------|
| child | Widget | |
| hscroll | string | Valid values are `"always`, `"automatic"`, `"external"`, `"never"`. |
| vscroll | string | Valid values are `"always`, `"automatic"`, `"external"`, `"never"`. |

```js
const scrollable = Widget.Scrollable({
    hscroll: 'always',
    vscroll: 'never',
    style: 'min-width: 20px;',
    child: Widget.Label('Lorem ipsum dolor sit amet, ' +
        'officia excepteur ex fugiat reprehenderit enim ' +
        'labore culpa sint ad nisi Lorem pariatur mollit'),
});
```

### Slider
subclass of [Gtk.Scale](https://gjs-docs.gnome.org/gtk30~3.0/gtk.scale)

| Property | Type | Description |
|----------|------|-------------|
| vertical | bool | Setting `vertical: true` is the same as `orientation: 1` |
| value | number |
| min | number |
| max | number |
| marks | tuple or number | where tuple is [number, string?, Position?], Position is `"top"`, `"left`, `"right`, `"bottom"`
| on-change | `(event: Gdk.Event) => void`

```js
Widget.Slider({
    on_change: ({ value }) => print(value),
    vertical: true,
    value: 0,
    min: 0,
    max: 1,
    marks: [
        1,
        2,
        [3, 'label'],
        [4, 'label', 'bottom'],
    ],
})
```

### Stack
subclass of [Gtk.Stack](https://gjs-docs.gnome.org/gtk30~3.0/gtk.stack)

| Property | Type | Description |
|----------|------|-------------|
| items | \[string, Widget\] | name - Widget pairs |
| shown | string | Name of the widget to show. This can't be set on construction, instead the first give widget will be shown. |
| transition | string | `transitionType` represented as a string. Valid values are `none`, `crossfade`, `slide_right`, `slide_left`, `slide_up`, `slide_down`, `slide_left_right`, `slide_up_down`, `over_up`, `over_down`, `over_left`, `over_right`, `under_up`, `under_down`, `under_left`, `under_right`, `over_up_down`, `over_down_up`, `over_left_right`, `over_right_left`

```js
const stack = Widget.Stack({
    items: [
        ['child1', Widget.Label('first child')],
        ['child2', Widget.Label('second child')],
    ],
    connections: [
        [SomeService, self => {
            self.shown = 'child2';
        }],
    ],
});
```

### Menu
subclass of [Gtk.Menu](https://gjs-docs.gnome.org/gtk30~3.0/gtk.menu)

| Property | Type |
|----------|------|
| children | MenuItem[] |
| on-popup | `(flipped_rect: void, final_rect: void, flipped_x: boolean, flipped_y: boolean) => void` |
| on-move-scroll | `(scroll_type: Gtk.ScrollType) => void` |

```js
// to have a menu popup on click
const button = Widget.Button({
    child: Widget.Label('click to open menu'),
    on_primary_click: (_, event) => Widget.Menu({
        children: [
            Widget.MenuItem({
                child: Widget.Label('hello'),
            }),
        ],
    }).popup_at_pointer(event),
});
```

### MenuItem
subclass of [Gtk.MenuItem](https://gjs-docs.gnome.org/gtk30~3.0/gtk.menuitem)

| Property | Type | Description |
|----------|------|-------------|
| child | Widget |
| on-activate | `() => boolean`
| on-select | `() => boolean`
| on-deselect | `() => boolean`
