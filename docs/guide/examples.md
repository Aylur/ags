# Examples

You can find some full examples on the
[repository](https://github.com/Aylur/ags/tree/main/examples).

## Monitor id does not match compositor

The monitor id property that windows expect is mapped by Gdk, which is not always
the same as the compositor. Instead use the `gdkmonitor` property which expects
a `Gdk.Monitor` object.

```tsx
function Bar(gdkmonitor) {
    return <window gdkmonitor={gdkmonitor} />
}

function main() {
    for (const monitor of app.get_monitors()) {
        if (monitor.model == "your-desired-model") {
            Bar(monitor)
        }
    }
}
```

## Environment variables

JavaScript is **not** bash or other shell environments.

```ts
const HOME = exec("echo $HOME") // does not work
```

`exec` and `execAsync` runs the passed program as is, its **not** run in a
shell environment, so the above example just passes `$HOME` as a string literal
to the `echo` program.

:::danger Please don't do this

```ts
const HOME = exec("bash -c 'echo $HOME'")
```

:::

You can read environment variables using
[GLib.getenv](https://gjs-docs.gnome.org/glib20~2.0/glib.getenv).

```ts
import GLib from "gi://GLib"

const HOME = GLib.getenv("HOME")
```

## Custom SVG symbolic icons

Put the svgs in a directory, name them `<icon-name>-symbolic.svg`
and use `app.add_icons()` or `icons` parameter in `app.start()`

:::code-group

```ts [app.ts]
app.start({
    icons: `/path/to/icons`, // this dir should include custom-symbolic.svg
    main() {
        Widget.Icon({
            icon: "custom-symbolic", // custom-symbolic.svg
            css: "color: green;", // can be colored, like other named icons
        })
    },
})
```

:::

:::info
If there is a name clash with an icon from your current icon pack
the icon pack will take precedence
:::

## Logging

The `console` API in GJS uses glib logging functions.
If you just want to print some text as is to stdout
use the globally available `print` function or `printerr` for stderr.

```ts
print("print this line to stdout")
printerr("print this line to stderr")
```

## Auto create Window for each Monitor

To have Window widgets appear on a monitor when its plugged in,
listen to `app.monitor-added`.

:::code-group

```tsx [Bar.tsx]
export default function Bar(gdkmonitor: Gdk.Monitor) {
    return <window gdkmonitor={gdkmonitor} />
}
```

:::

:::code-group

```ts [app.ts]
import Gtk from "gi://Gtk"
import Gdk from "gi://Gdk"
import Bar from "./Bar"

function main() {
    const bars = new Map<Gdk.Monitor, Gtk.Widget>()

    // initialize
    for (const gdkmonitor of app.get_monitors()) {
        bars.set(gdkmonitor, Bar(gdkmonitor))
    }

    app.connect("monitor-added", (_, gdkmonitor) => {
        bars.set(gdkmonitor, Bar(gdkmonitor))
    })

    app.connect("monitor-removed", (_, gdkmonitor) => {
        bars.get(gdkmonitor)?.destroy()
        bars.delete(gdkmonitor)
    })
}

app.start({ main })
```

:::

## Error: Can't convert non-null pointer to JS value

These happen when accessing list type properties. Gjs fails to correctly bind
`List` and other array like types of Vala as a property.

```ts
import Notifd from "gi://AstalNotifd"
const notifd = Notifd.get_default()

notifd.notifications // [!code --]
notifd.get_notifications() // [!code ++]
```

:::tip
Open up an issue/PR to add a [workaround](https://github.com/Aylur/ags/blob/main/lib/src/overrides.ts).
:::

## How to create regular floating windows

Use `Gtk.Window`.

By default `Gtk.Window` is destroyed on close.
To prevent this add a handler for `delete-event`.

```tsx {3-6}
return (
    <Gtk.Window
        $delete-event={(self) => {
            self.hide()
            return true
        }}
    >
        {child}
    </Gtk.Window>
)
```

## Is there a way to limit the width/height of a widget?

- Gtk3: Unfortunately not. You can set a minimum size with `min-width` and
  `min-heigth` css attributes, but you can not set max size.

- Gtk4: Yes, using custom layout managers. As a shortcut you can use
  [Adw.Clamp](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1.7/class.Clamp.html)

## How do I register keybindings?

If you want global keybindings use your compositor.
Only **focused** windows can capture events. To make a window
focusable set its keymode.

::: code-group

```tsx [gtk3]
<window
    keymode={Astal.Keymode.ON_DEMAND}
    $key-press-event={(self, event: Gdk.Event) => {
        if (event.get_keyval()[1] === Gdk.KEY_Escape) {
            self.hide()
        }
    }}
/>
```

```tsx [gtk4]
<window keymode={Astal.Keymode.ON_DEMAND}>
    <Gtk.EventControllerKey
        $key-pressed={({ widget }, keyval: number) => {
            if (keyval === Gdk.KEY_Escape) {
                widget.hide()
            }
        }}
    />
</window>
```

:::

## How to create a Popup

- Gtk4: simply use Gtk's builtin
  [Popover](https://docs.gtk.org/gtk4/class.Popover.html).

- Gtk3: you can create an
  [Astal.Window](https://aylur.github.io/libastal/astal3/class.Window.html)
  instance, position it and handle click events.
  Checkout [examples/gtk3/popover](https://github.com/Aylur/ags/tree/main/examples/gtk3/popover)
