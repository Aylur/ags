# Quick Start

It's as easy as a few lines to get a bar running on your screen.

:::details What will you be using

- [Gnome JavaScript (GJS)](https://gjs.guide/) is the JavaScript runtime
- [Astal](https://aylur.github.io/astal/) is a suite of libraries which lets you
  query and interact with parts of your system
- [Gnim](https://aylur.github.io/gnim/) is a library for GJS, which allows you
  to write widgets using JSX
- [AGS](https://aylur.github.io/ags/) is a CLI tool which lets you skip setting
  up a dev environment and jump straight into writing your Desktop Shell in
  TypeScript

:::

## Single file start

First create a file anywhere on your system.

::: code-group

```tsx [<i class="devicon-typescript-plain"></i> mybar.tsx]
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import { createPoll } from "ags/time"

app.start({
  main() {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
    const clock = createPoll("", 1000, "date")

    return (
      <window visible anchor={TOP | LEFT | RIGHT}>
        <label label={clock} />
      </window>
    )
  },
})
```

:::

And run it using the following command:

```sh
ags run ./mybar.tsx
```

Alternatively, you can add a shebang and make it executable

```ts [mybar.tsx]
#!/usr/bin/env -S ags run
import app from "ags/gtk4/app"

app.start({
  main() {
    // entry point
  },
})
```

```sh
chmod +x mybar.tsx
./mybar.tsx
```

## Using a template

It is recommended to start with a template which will setup files needed for
TypeScript development environments.

You can get started using a template with this simple command

```sh
ags init -d /path/to/project
```

If you are on nix, there is also a flake template

```sh
nix flake init --template github:aylur/ags
```
