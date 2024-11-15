# Migrating from v1

Ags was rewritten from scratch and unfortunately everything changed
drastically, you will have to rewrite your projects from the ground up.

You will have to go through the new wiki either way, but I'll highlight some
of the changes you will have to make.

## Sticking to v1

If you wish to stick to v1 you can clone the
[last commit](https://github.com/Aylur/ags/releases/tag/v1.9.0)

> [!NOTE] <i class="devicon-nixos-plain"></i> NixOS
> On NixOS simply switch the flake input to `ags.url = "github:aylur/ags/v1"`.

> [!NOTE] <i class="devicon-archlinux-plain"></i> Arch
> On Arch you can use the [v1 pkgbuild](https://github.com/kotontrion/PKGBUILDS/blob/main/agsv1/PKGBUILD)

## Entry Point

Instead of a fixed `~/.config/ags/config.js` entry you can name the main file
anything and specify it as an arg to `ags run </path/to/entry>`.

If you wish to stick to having the source code in `~/.config/ags` then
name the entry file `app.js`, `app.ts`, `app.jsx` or `app.tsx` which `ags run` will use by default.

The entry point in code changed from `App.config` to `App.start`

```js
App.config({ // [!code --:5]
    windows: [
        // window instances
    ]
})
import { App } from "astal/gtk3" // [!code ++:7]

App.start({
    main() {
        // any initialization code
    }
})
```

## Instantiating widgets

It is no longer recommend to create top level instances because scripts
can run in [client mode](https://aylur.github.io/astal/guide/typescript/cli-app#client)
and it is recommended to only execute code in either `main` or `client` callbacks.

```js
const win = Widget.Window() // [!code --:5]

App.config({
    windows: [win]
})
App.main({ // [!code ++:5]
    main() {
        new Widget.Window()
    }
})
```

## Templating

AGS now supports and recommends the usage of [JSX](https://aylur.github.io/astal/guide/typescript/first-widgets#creating-and-nesting-widgets).

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

const _ = Widget.Box({ // [!code --:3]
    child: var.bind().as(v => MyWidget(v))
})
const _ = <box>  // [!code ++:3]
    {var(v => <MyWidget v={v} />)}
</box>

const _ = Widget.Box({ // [!code --:5]
    children: var.bind().as(v => [
        MyWidget(v)
    ])
})
const _ = <box>  // [!code ++:5]
    {var(v => <>
        <MyWidget v={v} />
    </>)}
</box>
```

## Reactivity

Reactivity is still done through `Binding` objects and widget constructors.
API of [bindable](https://aylur.github.io/astal/guide/typescript/binding#subscribable-and-connectable-interface) objects are now defined.

```jsx
const label = Variable("hello")

Label({ // [!code --:3]
    label: label.bind().as(hello => `${hello} world`)
})
<label // [!code ++:3]
    label={label(hello => `${hello} world`)}
/>
```

## Hooks

```js
Widget.Button({ // [!code --:6]
    setup: self => {
        self.on("signal-name", handler)
        self.hook(obj, handler, "changed")
    }
})
<button // [!code ++:7]
    onSignalName={handler}
    setup={self => {
        self.hook(subscribable, handler)
        self.hook(connectable, "signal-name", handler)
    }}
/>
```

> [!NOTE]
> `.keybind` and `.poll` hooks have been removed.
> Polling should be done in `Variable`.
> Keybinds can be done in an onKeyPressEvent signal handler

## Widgets

Some widgets are no longer builtin, you'll have to make a
[subclass](https://aylur.github.io/astal/guide/typescript/widget#how-to-use-non-builtin-gtk-widgets).

```jsx
const cb = Widget.ColorButton() // [!code --]
const ColorButton = astalify(Gtk.ColorButton) // [!code ++:2]
const cb = <ColorButton />
```

## Variable

Instead of passing a config object as the second argument `Variable` now has
[.poll()](https://aylur.github.io/astal/guide/typescript/variable#subprocess-shorthands),
[.watch()](https://aylur.github.io/astal/guide/typescript/variable#subprocess-shorthands)
and [.observe()](https://aylur.github.io/astal/guide/typescript/variable#gobject-connection-shorthands).

```ts
// creating
const v = Variable("0", { // [!code --:3]
    poll: [1000, "command"],
})
const v = Variable("initial") // [!code ++:2]
    .poll(1000, "command")

// binding
const b1: Binding<number, any, any> = v1.bind().as(Number) // [!code --]
const b2: Binding<number> = v2(Number) // [!code ++]

// get and set
v.getValue() // [!code --:4]
v.value
v.setValue("value")
v.value = "value"
v.get() // [!code ++:2]
v.set("value")

// watching for changes
v.connect('changed', ({ value }) => { // [!code --:3]
    console.log(value)
})
v.subscribe(value => { // [!code ++:3]
    console.log(value)
})
```

[Variable composition](https://aylur.github.io/astal/guide/typescript/variable#variable-composition)
is also a lot more flexible.

## Globals

`App`, `Service`, `Utils`, `Widget`, `Variable` are no longer globally available

```js
import { Widget, App } from "astal/gtk3"
import * as fileUtils from "astal/file"
import * as procUtils from "astal/process"
import * as timeUtils from "astal/time"
import Variable from "astal/variable"
```

## Services

These are no longer called `Service`. There is no longer a distinction
between a `Service` and `GObject.Object` and there are no longer builtin Services.

These are now simply external [libraries](https://aylur.github.io/astal/guide/libraries/references#astal-libraries)
that will have to be installed next to AGS. They are now implemented in Vala or C
which makes it possible to also use them outside of AGS,
which is the reason for the existence of Astal and AGSv2.

They work very similarly however.

```js
// importing
const battery = await Service.import("battery") // [!code --]
import Battery from "gi://AstalBattery" // [!code ++:2]
const battery = Battery.get_default()

// binding
const b = battery.bind("percentage").as() // [!code --]
import { bind } from "astal" // [!code ++:2]
const b = bind(battery, "percentage").as()
```

Creating custom "Services" now simply means creating a `GObject.Object`
[subclass](https://aylur.github.io/astal/guide/typescript/gobject).

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
import { GObject, register, signal, property } from "astal/gobject" // [!code ++:7]

@register()
class MyService extends GObject.Object {
    @property(Number) declare myValue: number
    @signal(Number) declare mySignal: (n: number): void
}
```

## Utils

File, Process and Time utility functions are available from their own
[module](https://aylur.github.io/astal/guide/typescript/utilities)

```js
Utils.exec("command") // [!code --:3]
Utils.readFile("file")
Utils.timeout(1000, callback)
import { exec, readFile, timeout } from "astal" // [!code ++:4]
exec("command")
readFile("file")
timeout(1000, callback)
```

Icon lookup is available from Astal.

```js
Utils.lookUpIcon("icon-name") // [!code --]
import { Astal } from "astal/gtk3" // [!code ++:2]
Astal.Icon.lookup_icon("icon-name")
```

Authenticating have been moved to [AstalAuth](https://aylur.github.io/astal/guide/libraries/auth)

Fetch has not been ported, you can use `wget` or `curl`
with an `exec` or use libsoup.
You could also copy paste the source code of [Utils.fetch](https://github.com/Aylur/ags/blob/v1/src/utils/fetch.ts) into your own project.

Sending notifications will be available in [AstalNotifd](https://aylur.github.io/astal/guide/libraries/notifd).
Until then see [#26](https://github.com/Aylur/astal/issues/26).

## CLI

To make windows toggleable through cli you will have to now
[pass the `App` instance to `Window`](https://aylur.github.io/astal/guide/typescript/cli-app#toggling-windows-by-their-name) instances instead of passing
a an array of windows to `App.config`.

```js
App.config({ // [!code --:5]
    windows: [
        Widget.Window({ name: "window-name" })
    ]
})
App.start({ // [!code ++:5]
    main() {
        <window name="window-name" application={App}></window>
    }
})
```

`ags --run-js` have been retired in favor of [requests](https://aylur.github.io/astal/guide/typescript/cli-app#messaging-from-cli).

```ts
globalThis.myfunction = () => { // [!code --:3]
    print("hello")
}
App.start({ // [!code ++:8]
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
App.start({
    instanceName: "name"
})
```

```sh
ags -i name # [!code --:2]
ags -t window-name -i name
ags run # [!code ++:2]
ags toggle window-name -i name
```
