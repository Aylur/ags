# App and CLI

`app` is a singleton **instance** of an
[Astal.Application](https://aylur.github.io/libastal/astal4/class.Application.html).

Depending on Gtk version import paths will differ

```ts
import app from "astal/gtk3/app"
import app from "astal/gtk4/app"
```

> [!TIP]
>
> `Astal.Application`'s DBus name is prefixed with `io.Astal`. If you are
> writing a shell which is meant to be distributed you might want to avoid using
> `app` and instead create a subclass of `Gtk.Application` or `Adw.Application`
> while also following the
> [packaging conventions](https://gjs.guide/guides/gtk/application-packaging.html)

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

:::code-group

```ts [app.ts]
app.start({
  main() {
    // setup anything
    // instantiate widgets
  },
})
```

:::

## Instance identifier

You can run multiple instances by defining a unique instance name.

```ts
app.start({
  instanceName: "my-instance", // defaults to "astal"
  main() {},
})
```

## Messaging from CLI

If you want to interact with an instance from the CLI, you can do so by sending
a message.

```ts
app.start({
  requestHandler(request: string, res: (response: any) => void) {
    if (request == "say hi") {
      return res("hi cli")
    }
    res("unknown command")
  },
  main() {},
})
```

:::code-group

```sh [ags cli]
ags request "say hi"
# hi cli
```

```sh [astal cli]
astal say hi
# hi cli
```

:::

If you want to run arbitrary JavaScript from CLI, you can use the `eval()`
method which will evaluate the passed string as the body of an `async` function.

```ts
app.start({
  main() {},
  requestHandler(js, res) {
    app.eval(js).then(res).catch(res)
  },
})
```

If the string does not contain a semicolon, a single expression is assumed and
returned implicitly.

```sh
astal "'hello'"
# hello
```

If the string contains a semicolon, you have to return explicitly.

```sh
astal "'hello';"
# undefined

astal "return 'hello';"
# hello
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

```sh [astal]
astal -t Bar
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

## Client

The first time you invoke `app.start()` the `main` block gets executed. While
that instance is running any subsequent execution of the app will execute the
`client` block.

:::code-group

```ts [main.ts]
app.start({
  // main instance
  main(...args: Array<string>) {
    print(...args)
  },

  // every subsequent calls
  client(message: (msg: string) => string, ...args: Array<string>) {
    const res = message("you can message the main instance")
    print(res)
  },

  // this runs in the main instance
  requestHandler(request: string, res: (response: any) => void) {
    res("response from main")
  },
})
```

:::
