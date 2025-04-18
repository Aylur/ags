# Migration Guide

## From v2

### Subclassing

`astalify` has been removed, `jsx` function and JSX expressions handle
everything. It is possible to use Gtk widgets directly without any prior setup.

```tsx
const Calendar = astalify(Gtk.Calendar) // [!code --:2]
const _ = <Calendar />
const _ = <Gtk.Calendar /> // [!code ++:1]
```

If you still prefer to use regular JS functions instead of JSX, you can do

```ts
import { CCProps } from "ags/gtk4"
type BoxProps = CCProps<Gtk.Box, Gtk.Box.ConstructorProps>
const Box = (props: BoxProps) => jsx(Gtk.Box, props)

Box({
    orientation: bind(state),
    children: [
        Box()
    ]
})
```

### Syntax changes

* `onSignal` -> `$signal`
* `onNotifyProp` -> `$$prop`
* `setup` -> `$`
* `className` -> `class`

```tsx
<button
    $clicked={() => print("clicked")}
/>
```

### Variable

`Variable` has been removed in favor of [`State`](./state-management)

### Dynamic rendering

Dynamic children rendering is done with `<With>` and `<For>` components.
`children` prop can no longer take a `Binding`.

```tsx
const value: Binding<object>
const list: Binding<Array<object>>

<box>
    {value.as(value => ( // [!code --:3]
        <></>
    ))}
    <With value={value}>  // [!code ++:5]
        {value => (
            <></>
        )}
    </For>
    {list.as(list => list.map(item => ( // [!code --:3]
        <></>
    )))}
    <For each={list}>  // [!code ++:5]
        {item => (
            <></>
        )}
    </For>
</box>
```

## From v1

Ags was rewritten from scratch and unfortunately everything changed
drastically, you will have to rewrite your projects from the ground up.

There were so many changes I'm unable to list everything, but these are
some highlights.

### Entry Point

Instead of a fixed `~/.config/ags/config.js` entry you can name the main file
anything and specify it as an arg to `ags run </path/to/entry>`.

If you wish to stick to having the source code in `~/.config/ags` then
name the entry file `app.js`, `app.ts`, `app.jsx` or `app.tsx` which
`ags run` will use by default.

The entry point in code changed from `App.config` to `app.start`

```js
App.config({ // [!code --:5]
    windows: [
        // window instances
    ],
})
import app from "astal/gtk4/app" // [!code ++:7]

app.start({
    main() {
        // any initialization code
    },
})
```

### Instantiating widgets

It is no longer recommended to create top level instances because scripts
can run in
[client mode](https://aylur.github.io/astal/guide/typescript/cli-app#client)
and it is recommended to only execute code in either `main` or `client` blocks.

```js
const win = Widget.Window() // [!code --:5]

App.config({
    windows: [win],
})
app.main({ // [!code ++:5]
    main() {
        new Widget.Window()
    },
})
```

### Templating

AGS now supports and recommends the usage of
[JSX](./first-widgets#creating-and-nesting-widgets).

```jsx
const _ = Widget.Box({ // [!code --:6]
    vertical: true,
    children: [
        Widget.Label("hello")
    ]
})
const _ = <box vertical> // [!code ++:3]
    <label label="hello" />
</box>
```

### Reactivity

`Variable` has been removed with `State` as its successor.
`bind` is now a top level function instead of method on each instance.

```jsx
const label = Variable("hello")  // [!code --:5]

Label({
    label: label.bind().as(hello => `${hello} world`)
})
import { State, bind } from "ags/state"  // [!code ++:6]
const label = new State("hello")
return <label
    label={bind(label).as(hello => `${hello} world`)}
/>
```

### Hooks

Widgets are no longer subclassed, added methods have been removed.

```jsx
Widget.Button({ // [!code --:6]
    setup: self => {
        self.on("signal-name", handler)
        self.hook(obj, handler, "changed")
    }
})
import { hook } from "ags/state" // [!code ++:9]

return <button
    $signal-name={handler}
    $={self => {
        hook(self, obj, "signal-name", handler)
    }}
/>
```

> [!NOTE] > `.keybind` and `.poll` hooks have been removed.
> Polling should be done in `State`.
> Keybinds should be done using the intended Gtk APIs.

### Widgets

`JSX` handles everything, it is no longer needed to subclass widgets.
Some widgets are no longer builtin, you'll have to make a
[subclass](https://aylur.github.io/astal/guide/typescript/widget#how-to-use-non-builtin-gtk-widgets).

```jsx
import Gtk from "gi://Gtk"
const calendar = <Gtk.Calendar />
```

### Variable

`Variable` has been removed in favor of [`State`](./state-management)

### Globals

`App`, `Service`, `Utils`, `Widget`, `Variable` are no longer globally available

```js
import app from "astal/gtk3/app"
import * as fileUtils from "astal/file"
import * as procUtils from "astal/process"
import * as timeUtils from "astal/time"
import { State, bind } from "astal/state"
```

### Services

These are no longer called `Service`. There is no longer a distinction
between a `Service` and `GObject.Object` and there are no longer builtin Services.

These are now simply external [libraries](https://aylur.github.io/astal/guide/libraries/references#astal-libraries)
that will have to be installed next to AGS. They are now implemented in Vala
or C which makes it possible to also use them outside of AGS.

They work very similarly however.

```js
// importing
const battery = await Service.import("battery") // [!code --]
import Battery from "gi://AstalBattery" // [!code ++:2]
const battery = Battery.get_default()

// binding
const b = battery.bind("percentage").as() // [!code --]
import { bind } from "ags" // [!code ++:2]
const b = bind(battery, "percentage").as()
```

Creating custom "Services" now simply means creating a `GObject.Object`
subclass.

```ts
class MyService extends Service { // [!code --:12]
    static {
        Service.register(this, {
            'my-signal': ['float'],
        }, {
            'my-value': ['float', 'rw'],
        });
    }

    get my_value(): number
    set my_value(v: number)
}
import GObject, { register, signal, property } from "ags/gobject" // [!code ++:7]

@register()
class MyService extends GObject.Object {
    @property(Number) declare myValue: number
    @signal(Number) declare mySignal: (n: number): void
}
```

### Utils

* File, Process and Time utility functions are available from their own
[module](./utilities)

  ```js
  Utils.exec("command") // [!code --:4]
  Utils.readFile("file")
  Utils.timeout(1000, callback)
  Utils.fetch("url")
  import { exec } from "ags/process" // [!code ++:4]
  import { readFile } from "ags/file"
  import { timeout } from "ags/time"
  import { fetch } from "ags/fetch"
  ```

* Icon lookup is has no alternative use `Gtk.IconTheme`.

* Authenticating have been moved to
  [AstalAuth](https://aylur.github.io/astal/guide/libraries/auth)

* Sending notifications will be available in [AstalNotifd](https://aylur.github.io/astal/guide/libraries/notifd).
  Until then see [#26](https://github.com/Aylur/astal/issues/26).

### CLI

To make windows toggleable through CLI you will have to now
[pass the `app` instance to `Window`](./app-cli#toggling-windows-by-their-name) instances instead of passing an array of windows to `App.config`.

```js
App.config({ // [!code --:5]
    windows: [Widget.Window({ name: "window-name" })],
})
app.start({ // [!code ++:5]
    main() {
        return <window name="window-name" application={App}></window>
    },
})
```

`ags --run-js` have been retired in favor of [requests](./app-cli#messaging-from-cli).

```ts
globalThis.myfunction = () => { // [!code --:3]
    print("hello")
}
app.start({ // [!code ++:8]
    requestHandler(request: string, res: (response: any) => void) {
        if (request == "myfunction") {
            res("hello")
        }
        res("unknown command")
    },
})
```

```sh
ags -r "myfunction()" # [!code --]
ags request myfunction # [!code ++]
```

Instance name is now defined in code instead of cli of first launch

```js
app.start({
    instanceName: "name",
})
```

```sh
ags -i name # [!code --:2]
ags -t window-name -i name
ags run # [!code ++:2]
ags toggle window-name -i name
```
