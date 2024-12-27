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
- sass: importing `.scss` files will go through the sass transpiler and be inlined as a string that contains valid css using the `sass` executable found on `$PATH`
  :::code-group

  ```scss [<i class="devicon-sass-plain"></i>style.scss]
  $color: white;

  selector {
      color: $color;
  }
  ```

  :::
  :::code-group

  ```ts [<i class="devicon-typescript-plain"></i> app.ts]
  import style from "./style.scss"

  print(style)
  // selector {
  //   color: white;
  // }
  ```

  :::

- blp: importing `.blp` files will go through [blueprint](https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/) and be inlined as a string that contains xml template definitions
  :::code-group

  ```blp [<i class="devicon-xml-plain"></i> ui.blp]
  using Gtk 4.0;

  Label {
      label: _("hello");
  }
  ```

  :::
  :::code-group

  ```ts [<i class="devicon-typescript-plain"></i> app.ts]
  import ui from "./ui.blp"

  print(ui)
  // <?xml version="1.0" encoding="UTF-8"?>
  // <interface>
  //   <requires lib="gtk" version="4.0"/>
  //   <object class="GtkLabel">
  //     <property name="label" translatable="yes">hello</property>
  //   </object>
  // </interface>
  ```

  :::

- inline: importing with `inline:/path/to/file` will inline the contents of the file as a string
  :::code-group

  ```txt [data.txt]
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do.
  ```

  :::
  :::code-group

  ```ts [<i class="devicon-typescript-plain"></i> app.ts]
  import data from "inline:./data.txt"

  print(ui)
  // Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do.
  ```

  :::

AGS defines `SRC` which by default will point to the directory of `entryfile`.
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
a good practice would be to:

1. Install data files to a directory, usually `/usr/share/your-project`
2. Define it as `DATADIR` in `env.d.ts` and at bundle time with `--define`
3. In code you can refer to data files through this `DATADIR` variable

  :::code-group

  ```meson [meson.build]
  prefix = get_option('prefix')
  pkgdatadir = prefix / get_option('datadir') / meson.project_name()
  bindir = prefix / get_option('bindir')

  install_data(
    files('data/data.txt'),
    install_dir: pkgdatadir,
  )

  custom_target(
    command: [
      find_program('ags'),
      'bundle',
      '--define', 'DATADIR="' + pkgdatadir + '"',
      meson.project_source_root() / 'app.ts',
      meson.project_name(),
    ],
    output: [meson.project_name()],
    input: files('app.ts'),
    install: true,
    install_dir: bindir,
  )
  ```

  ```ts [env.d.ts]
  declare const DATADIR: string
  ```

  ```ts [app.ts]
  const data = `${DATADIR}/data.txt`
  ```

  :::

> [!TIP]
> On Nix you can use the [lib.bundle](./nix#bundle-and-devshell) function as well as meson.

## Notice for Gtk4

[`gtk4-layer-shell` needs to be linked before wayland.](https://github.com/wmww/gtk4-layer-shell/issues/3#issuecomment-1502339477)
When bundling a Gtk4 application you will have to use a wrapper to make it work.

:::code-group

```bash [wrapper.sh]
#!/bin/bash
LD_PRELOAD="@LAYER_SHELL_LIBDIR@/libgtk4-layer-shell.so" @MAIN_PROGRAM@ $@
```

:::
:::code-group

```meson [meson.build]
pkgdatadir = get_option('prefix') / get_option('datadir') / meson.project_name()
main = meson.project_name() + '.wrapped'

custom_target(
  command: [
    find_program('ags'),
    'bundle',
    meson.project_source_root() / 'app.ts',
    main,
  ],
  output: [meson.project_name()],
  input: files('app.ts'),
  install: true,
  install_dir: pkgdatadir,
)

configure_file(
  input: files('wrapper.sh'),
  output: meson.project_name(),
  configuration: {
    'MAIN_PROGRAM': pkgdatadir / main,
    'LAYER_SHELL_LIBDIR': dependency('gtk4-layer-shell-0').get_variable('libdir'),
  },
  install: true,
  install_dir: get_option('prefix') / get_option('bindir'),
)
```

:::
