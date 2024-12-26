# Bundling projects

Bundling can be done with the `ags bundle` command.

:::details
Uses [esbuild](https://esbuild.github.io/) under the hood.
:::

```sh
$ ags bundle --help

Bundle an app

Usage:
  ags bundle [entryfile] [outfile] [flags]

Examples:
  bundle app.ts my-shell -d "DATADIR='/usr/share/my-shell'"

Flags:
  -d, --define stringArray   replace global identifiers with constant expressions
  -h, --help                 help for bundle
  -p, --package              use astal package as defined in package.json
```

Currently there are 3 builtin plugins.

- css: import `.css` will be inlined as a string
- sass: importing `.scss` files will go through the sass transpiler and be inlined as a string that contains valid css
  - uses the `sass` executable found on $PATH
- blp: importing `.blp` files will go through [blueprint](https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/) and be inlined as a string that contains valid xml template definitions
- inline: importing with `inline:/path/to/file` will inline the contents of the file as a string

AGS defines `SRC` by default which by default will point to the directory of `entryfile`.
It can be overriden with `-d "SRC='/path/to/source'"`

```js
#!/usr/bin/ags run
App.start({
    main() {
        print(`source dir is ${SRC}`)
    }
})
```

By default `ags bundle` will alias the `astal` package for the one defined
at [installation](./install).

This behavior can be altered by using the `--package` flag which will instead
use the astal package as defined in `package.json`.

## Example

:::code-group

```blp [Bar.blp]
using Gtk 4.0;
using Astal 4.0;

template $Bar: Astal.Window {
    // bitfields currently don't work in blueprint
    // anchor: top | left | right;
    exclusivity: exclusive;

    CenterBox {
        center-widget: Label {
            label: "hello";
        };
    }
}
```

:::

:::code-group

```ts [app.ts]
#!/usr/bin/gjs -m
import { register } from "astal/gobject"
import { App, Astal } from "astal/gtk4"
import Template from "./Bar.blp"

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

@register({ GTypeName: "Bar", Template })
class Bar extends Astal.Window {
}

App.start({
    instanceName: "bar",
    main() {
        new Bar({
            application: App,
            anchor: TOP | LEFT | RIGHT,
            visible: true,
        })
    }
})
```

:::

```sh
ags bundle ./app.ts bar
chmod +x ./bar

./bar
```

> [!NOTE]
> On Nix this still has to be done in a derivation
> as the bundled script is not wrapped.

## Distributing

If you have no data files, you can use `ags bundle`
and distribute its output JS file as an executable.
Optionally use a build tool like meson to also declare its runtime dependencies.

When you have data files that you cannot inline as a string, for example icons,
a good practice would be to.

1. Install data files to a directory, usually `/usr/share/your-project`
2. Define it as `DATADIR` in `env.d.ts` and at bundle time with `--define`
3. In code you can refer to data files through this `DATADIR` variable

Optionally you should use a build tool like meson or a makefile
to let users decide where to install to.

> [!NOTE]
> On Nix you can use the [lib.bundle](./nix#bundle-and-devshell) function.
