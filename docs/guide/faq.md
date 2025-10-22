# Frequently Asked Questions

## Standard Library

GJS does not include Node.js APIs you might be used to. You can find the
alternative for most APIs in `GLib` and `Gio`.

## Avoid JSX

JSX syntax is entirely optional. Under the hood it is just syntactic sugar for
[function composition](https://aylur.github.io/gnim/jsx#jsx-expressions-and-jsx-function).

```tsx
function Bar() {
  // [!code --:5]
  return (
    <window name="Bar">
      <box />
    </window>
  )
  // [!code ++:4]
  return jsx(Astal.Window, {
    name: "Bar",
    children: [jsx(Gtk.Box, {})],
  })
}
```

> [!TIP]
>
> You can wrap Gtk/Astal widgets in a simple function to achieve the syntax used
> in AGSv1:
>
> ```ts
> import { CCProps, jsx } from "ags"
> import { Gtk, Astal } from "ags/gtk4"
>
> const Box = (props: Partial<CCProps<Gtk.Box, Gtk.Box.ConstructorProps>>) =>
>   jsx(Gtk.Box, props)
>
> const Window = (
>   props: Partial<CCProps<Astal.Window, Astal.Window.ConstructorProps>>,
> ) => jsx(Astal.Window, props)
>
> function Bar() {
>   return Window({
>     name: "Bar",
>     children: [Box({ children: ["Hello There"] })],
>   })
> }
> ```

## Monitor id does not match compositor

The monitor id property that windows expect is mapped by Gdk, which is not
always the same as the compositor. Instead use the `gdkmonitor` property which
expects a `Gdk.Monitor` object.

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
const HOME = exec("echo $HOME") // does not work as you'd expect
```

`exec` and `execAsync` runs the passed program as is, its **not** run in a shell
environment, so the above example just passes `$HOME` as a string literal to the
`echo` program.

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

Put the svgs in a directory following the freedesktop spec, name them
`<icon-name>-symbolic.svg` and use `app.add_icons()` or `icons` parameter in
`app.start()`

```txt
.
├── icons
│   └── hicolor
│       └── scalable
│           └── actions
│               └── custom-symbolic.svg
└── app.ts
```

:::code-group

```ts [app.ts]
app.start({
  icons: `${SRC}/icons`, // SRC will point to the root
  main() {
    new Gtk.Image({
      iconName: "custom-symbolic",
    })
  },
})
```

:::

> [!INFO]
>
> If there is a name clash with an icon from your current icon pack the icon
> pack will take precedence

## Logging

The `console` API in GJS uses glib logging functions. If you just want to print
some text as is to stdout use the globally available `print` function or
`printerr` for stderr.

```ts
print("print this line to stdout")
printerr("print this line to stderr")
```

## Auto create Window for each Monitor

You can use the `<For>` component to auto create/destroy a top-level widget
automatically for each monitor.

```tsx [app.ts]
import Gtk from "gi://Gtk"
import Bar from "./Bar"
import { For, This, createBinding } from "ags"

function main() {
  const monitors = createBinding(app, "monitors")

  return (
    <For each={monitors}>
      {(monitor) => (
        <This this={app}>
          <window
            name="MyWindow"
            gdkmonitor={monitor}
            $={(self) => onCleanup(() => self.destroy())}
          />
          {otherWindows}
        </This>
      )}
    </For>
  )
}

app.start({ main })
```

## Error: Can't convert non-null pointer to JS value

These happen when accessing list type properties. Gjs fails to correctly bind
`List` and other array like types of Vala as a property.

```ts
import Notifd from "gi://AstalNotifd"
const notifd = Notifd.get_default()

notifd.notifications // [!code --]
notifd.get_notifications() // [!code ++]
```

> [!TIP]
>
> Open up an issue/PR to add a
> [workaround](https://github.com/Aylur/ags/blob/main/lib/src/overrides.ts).

## How to create regular floating windows

Use `Gtk.Window`.

By default `Gtk.Window` is destroyed on close. To prevent this add a handler for
`delete-event`.

```tsx {3-6}
return (
  <Gtk.Window
    onDeleteEvent={(self) => {
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

Only **focused** windows can capture events. To make a window focusable set its
keymode.

::: code-group

```tsx [gtk3]
<window
  keymode={Astal.Keymode.ON_DEMAND}
  onKeyPressEvent={(self, event: Gdk.Event) => {
    if (event.get_keyval()[1] === Gdk.KEY_Escape) {
      self.hide()
    }
  }}
/>
```

```tsx [gtk4]
<window keymode={Astal.Keymode.ON_DEMAND}>
  <Gtk.EventControllerKey
    onKeyPressed={({ widget }, keyval: number) => {
      if (keyval === Gdk.KEY_Escape) {
        widget.hide()
      }
    }}
  />
</window>
```

:::

> [!TIP]
>
> If you want global keybindings you have to use your compositor keybinding
> settings. You can define a [request handler](./app-cli#messaging-from-cli) and
> invoke it using a compositor keybinding.

## How to create a Popup

- Gtk4: simply use Gtk's builtin
  [Popover](https://docs.gtk.org/gtk4/class.Popover.html).

- Gtk3: you can create an
  [Astal.Window](https://aylur.github.io/libastal/astal3/class.Window.html)
  instance, position it and handle click events. Checkout
  [examples/gtk3/popover](https://github.com/Aylur/ags/tree/main/examples/gtk3/popover)
