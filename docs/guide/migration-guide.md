# Migration Guide

## From v2

### Import paths

`astal` namespace have been dropped. AGS is now using
[Gnim](https://github.com/aylur/gnim) which is reexported from the `ags`
namespace.

```ts
import { App, Gtk } from "astal/gtk3" // [!code --:2]
import { bind, Variable } from "astal/state"
import app from "ags/gtk3/app" // [!code ++:3]
import Gtk from "gi://Gtk?version=3.0"
import { createBinding, createState } from "ags"
```

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
import { CCProps } from "ags"
import { Gtk } from "ags/gtk4"
type BoxProps = CCProps<Gtk.Box, Gtk.Box.ConstructorProps>
const Box = (props: BoxProps) => jsx(Gtk.Box, props)

Box({
  orientation: state,
  children: [Box()],
})
```

### GObject decorators

They were updated to the stage 3 proposal. You can read more about them on the
[Gnim](https://aylur.github.io/gnim/gobject.html) documentation.

```ts
@register()
class MyObj extends GObject.Object {
  @property(String) declare myProp: string // [!code --]
  @property(String) myProp = "" // [!code ++]

  @property(String) // [!code --]
  @getter(String) // [!code ++]
  get myProp() {
    return ""
  }

  @property(String) // [!code --]
  @setter(String) // [!code ++]
  set myProp(v: string) {
    //
  }
}
```

### Syntax changes

- `setup` -> `$`
- `className` -> `class`

```tsx
<button class="my-button" $={(self) => print("ref", self)} />
```

### Variable

`Variable` has been removed in favor of `Accessor` and `createState`. You can
read more about them on the
[Gnim](https://aylur.github.io/gnim/jsx.html#state-management) documentation.

```tsx
const v = Variable("") // [!code --:3]
return <label label={v()} />
v.set("new value")
const [v, setV] = createState("") // [!code ++:3]
return <label label={v} />
setV("new value")
```

Variable methods have a matching Accessor create functions

- `.poll`: [`createPoll`](./utilities.md#createpoll)
- `.watch`: [`createSubprocess`](./utilities.md#createsubprocess)
- `.observe`:
  [`createConnection`](https://aylur.github.io/gnim/jsx#createconnection)
- `.derive`: [`createComputed`](https://aylur.github.io/gnim/jsx#createcomputed)

- `.drop`: Accessors cannot be explicitly cleaned up. Use the intended create
  functions which will be cleaned up automatically.

### Binding

`Binding` and `bind` has been removed but the API is identical with the only
difference being that you need to use an Accessor creator function.

```ts
import { bind } from "astal" // [!code --:2]
const v = bind(object, "prop")
import { createBinding } from "ags" // [!code ++:2]
const v = createBinding(object, "prop")
return <label label={v(v => `transformed ${v}`)} />
```

### Dynamic rendering

Dynamic children rendering is done with `<With>` and `<For>` components.
`children` prop can no longer take a `Binding`.

<!-- prettier-ignore -->
```tsx
const value: Binding<object>
const list: Binding<Array<object>>

return (
  <box>
    {value.as((value) => ( // [!code --:3]
      <></>
    ))}
    <With value={value}> // [!code ++:3]
      {(value) => <></>}
    </With>
    {list.as(list => list.map(item => ( // [!code --:3]
      <></>
    )))}
    <For each={list}> // [!code ++:3]
      {(item) => <></>}
    </For>
  </box>
)
```

## From v1

Ags was rewritten from scratch and unfortunately everything changed drastically,
you will have to rewrite your projects from the ground up.

There were so many changes I'm unable to list everything, but these are some
highlights.

### Entry Point

Instead of a fixed `~/.config/ags/config.js` entry you can name the main file
anything and specify it as an arg to `ags run </path/to/entry>`.

If you wish to stick to having the source code in `~/.config/ags` then name the
entry file `app.js`, `app.ts`, `app.jsx` or `app.tsx` which `ags run` will use
by default.

The entry point in code changed from `App.config` to `app.start`

<!-- prettier-ignore -->
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

It is no longer recommended to create top level instances because scripts can
run in
[client mode](https://aylur.github.io/astal/guide/typescript/cli-app#client) and
it is recommended to only execute code in either `main` or `client` blocks.

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```jsx
const _ = Widget.Box({ // [!code --:4]
  vertical: true,
  children: [Widget.Label("hello")],
})
const _ = ( // [!code ++:5]
  <box vertical> 
    <label label="hello" />
  </box>
)
```

### Reactivity

`Variable` has been removed in favor of signals.

```jsx
const label = Variable("hello") // [!code --:5]

Label({
  label: label.bind().as((hello) => `${hello} world`),
})
import { createState } from "ags" // [!code ++:6]
const [label, setLabel] = createState("hello")
return <label label={label((hello) => `${hello} world`)} />
```

### Hooks

Widgets are no longer subclassed, added methods have been removed.

<!-- prettier-ignore -->
```jsx
Widget.Button({ // [!code --:6]
  setup: (self) => {
    self.on("signal-name", handler)
    self.hook(obj, handler, "changed")
  },
})
import { onCleanup } from "ags" // [!code ++:14]

function MyWidget() {
  const id = obj.connect("signal-name", callback)

  onCleanup(() => {
    obj.disconnect(id)
  })

  return (
    <button onClicked={handler} />
  )

}
```

> [!NOTE]
>
> `.keybind` and `.poll` hooks have been removed. Polling should be done using
> `createPoll`. Keybinds should be done using the intended Gtk APIs.

### Widgets

`JSX` handles everything, it is no longer needed to subclass widgets.

```jsx
import Gtk from "gi://Gtk"
const calendar = <Gtk.Calendar />
```

### Globals

`App`, `Service`, `Utils`, `Widget`, `Variable` are no longer globally available

```js
import app from "ags/gtk4/app"
import * as fileUtils from "ags/file"
import * as procUtils from "ags/process"
import * as timeUtils from "ags/time"
import { createBinding, createState } from "ags"
```

### Services

These are no longer called `Service`. There is no longer a distinction between a
`Service` and `GObject.Object` and there are no longer builtin Services.

These are now simply external
[libraries](https://aylur.github.io/astal/guide/libraries/references#astal-libraries)
that will have to be installed next to AGS. They are now implemented in Vala or
C which makes it possible to also use them outside of AGS.

They work very similarly however.

```js
// importing
const battery = await Service.import("battery") // [!code --]
import Battery from "gi://AstalBattery" // [!code ++:2]
const battery = Battery.get_default()

// binding
const b = battery.bind("percentage") // [!code --]
import { createBinding } from "ags" // [!code ++:2]
const b = createBinding(battery, "percentage")
```

Creating custom "Services" now simply means creating a `GObject.Object`
subclass.

<!-- prettier-ignore -->
```ts
class MyService extends Service { // [!code --:16]
  static {
    Service.register(
      this,
      {
        "my-signal": ["float"],
      },
      {
        "my-value": ["float", "rw"],
      },
    )
  }

  get my_value(): number
  set my_value(v: number)
}
import GObject, { register, signal, property } from "ags/gobject" // [!code ++:9]

@register()
class MyService extends GObject.Object {
  @property(Number) myValue = 0

  @signal(Number)
  mySignal(n: number): void {}
}
```

### Utils

- File, Process and Time utility functions are available from their own
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

- Icon lookup is has no alternative. Use `Gtk.IconTheme`.

- Authenticating have been moved to
  [AstalAuth](https://aylur.github.io/astal/guide/libraries/auth)

- Sending notifications will be available in
  [AstalNotifd](https://aylur.github.io/astal/guide/libraries/notifd). Until
  then see [#26](https://github.com/Aylur/astal/issues/26).

### CLI

To make windows toggleable through CLI you will have to now
[pass the `app` instance to `Window`](./app-cli#toggling-windows-by-their-name)
instances instead of passing an array of windows to `App.config`.

<!-- prettier-ignore -->
```js
App.config({ // [!code --:3]
  windows: [Widget.Window({ name: "window-name" })],
})
app.start({ // [!code ++:5]
  main() {
    return <window name="window-name" application={app}></window>
  },
})
```

`ags --run-js` have been removed in favor of
[requests](./app-cli#messaging-from-cli).

<!-- prettier-ignore -->
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
