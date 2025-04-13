# Quick Start

## What will you be using

- [Gnome JavaScript (GJS)](https://gjs.guide/) is the JavaScript runtime
- [Astal](https://aylur.github.io/astal/) is a suite of libraries which lets you query, monitor and interact with parts of your system
- [Gjsx](https://aylur.github.io/gjsx/) is a set of convinience libraries for GJS, which allows you to write widgets using JSX syntax
- [AGS](https://aylur.github.io/ags/) is a CLI tool which lets you skip setting up a dev environment and jump straight into writing your Desktop Shell in TypeScript

## Get Started

It's as easy as a few lines to get a bar running on your screen.

```tsx [mybar.tsx]
#!/usr/bin/env ags run
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import { Poll } from "ags/state"

app.start({
    main() {
        const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
        const clock = new Poll("", 1000, "data")

        return (
            <window visible anchor={TOP | LEFT | RIGHT}>
                <label label={clock()} />
            </window>
        )
    },
})
```

Alternatively you can get started using a template

```sh
ags init
```

If you are on nix, there is also a flake template

```sh
nix flake init --template github:aylur/ags
```
