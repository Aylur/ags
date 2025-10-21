# App and CLI

`app` is a singleton **instance** of an
[Gtk.Application](https://docs.gtk.org/gtk4/class.Application.html).

Depending on Gtk version import paths will differ

```ts
import app from "astal/gtk3/app"
import app from "astal/gtk4/app"
```

> [!TIP]
>
> The `app` instance's DBus name is prefixed with `io.Astal`. If you are writing
> a shell which is meant to be distributed you might want to avoid using `app`
> and instead create a subclass of `Gtk.Application` or `Adw.Application` while
> also following the
> [packaging conventions](https://gjs.guide/guides/gtk/application-packaging.html).

::: details Example App implementation

```tsx
import Astal from "gi://Astal?version=4.0"
import Gio from "gi://Gio?version=2.0"
import GObject from "gi://GObject?version=2.0"
import Gtk from "gi://Gtk?version=4.0"
import { programInvocationName, programArgs } from "system"
import { createRoot } from "gnim"

class App extends Gtk.Application {
  static {
    GObject.registerClass(this)
  }

  constructor() {
    super({
      applicationId: "my.awesome.app",
      flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE,
    })
  }

  vfunc_command_line(cmd: Gio.ApplicationCommandLine): number {
    const args: string[] = cmd.get_arguments()

    if (cmd.isRemote) {
      console.log("invoked from remote instance")
      cmd.print_literal("hello from primary instance")
      cmd.done()
    } else {
      this.main(args)
    }

    return 0
  }

  private main(args: string[]) {
    createRoot((dispose) => {
      this.connect("shutdown", dispose)

      return (
        <Astal.Window name="bar" application={this}>
          <Gtk.CenterBox>
            <Gtk.Label $type="center" label="My Awesome Bar" />
          </Gtk.CenterBox>
        </Astal.Window>
      )
    })
  }
}

const app = new App()
app.runAsync([programInvocationName, ...programArgs])
```

:::

## Entry point

You should generally avoid creating resources in the top level of modules and
instead create everything in the scope of the `main` function. This is due to
the possibility of running as a [client](./app-cli#clients) process.

:::code-group

```tsx [app.tsx]
const globalInstance = SomeLibrary.get_default() // [!code --]

function Bar() {
  const globalInstance = SomeLibrary.get_default() // [!code ++]

  return <></>
}

app.start({
  main() {
    Bar()
  },
})
```

:::

## Instance identifier

You can run multiple instances by defining a unique instance name.

```ts
app.start({
  instanceName: "my-instance", // defaults to "ags"
  main() {},
})
```

## Messaging from CLI

If you want to interact with an instance from the CLI, you can do so by sending
a request. A request is an argument array.

```ts
app.start({
  requestHandler(argv: string[], response: (response: string) => void) {
    const [cmd, arg, ...rest] = argv
    if (cmd == "say") {
      return response(arg)
    }
    response("unknown command")
  },
  main() {},
})
```

The `response` function can be called once per request. `ags request` command
will wait until a response is given at which point it will print it and exit.

```sh
ags request say hi
# hi
```

A request handler can also be defined by connecting to the `request` signal.

```ts
app.connect("reqeust", (app, [cmd, arg, ...rest], response) => {
  if (cmd === "say") {
    response(arg)
  }
})
```

## Toggling Windows by their name

In order for the application to know about your windows, you have to register
them. You can do this by specifying a **unique** `name` and calling
`app.add_window()`

```tsx {5}
import app from "astal/gtk4/app"

function Bar() {
  return (
    <window name="Bar" $={(self) => app.add_window(self)}>
      <box />
    </window>
  )
}
```

You can also invoke `app.add_window()` by simply passing `app` to the
`application` prop.

```tsx {5}
import app from "astal/gtk4/app"

function Bar() {
  return (
    <window name="Bar" application={app}>
      <box />
    </window>
  )
}
```

> [!WARNING]
>
> When assigning the `application` prop make sure `name` comes before. Props are
> set sequentially and if name is applied after application it won't work.

Toggle the visibility of windows using the `ags` CLI.

```sh
ags toggle Bar
```

> [!TIP]
>
> In JavaScript you can get a window instance and toggle it using
> `app.get_window()`
>
> ```ts
> const bar = app.get_window("Bar")
> if (bar) bar.visible = true
> ```

## Clients

The first time you invoke `app.start()` (for example with `ags run`) the `main`
block gets executed. While that instance is running any subsequent execution of
the app will simply invoke a [request](#messaging-from-cli). For example running
`ags run` again will be the equivalent of running `ags request`

:::code-group

```ts [app.ts]
app.start({
  requestHandler(argv, response) {
    console.log("request", ...argv)
    response("hello from main instance")
  },
  main(...argv: string[]) {
    console.log(...argv)
  },
})
```

:::
