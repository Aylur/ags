# Quick Start

1. Install

:::code-group

```sh [<i class="devicon-archlinux-plain"></i> Arch]
yay -S aylurs-gtk-shell-git
```

```sh [<i class="devicon-nixos-plain"></i> NixOS]
nix shell github:aylur/ags # ags in a temporary shell
```

:::

2. Initialize a project

:::code-group

```sh [Gtk3]
ags init --gtk 3
```

```sh [Gtk4]
ags init --gtk 3
```

:::

3. Run the project

:::code-group

```sh [Gtk3]
ags run
```

```sh [Gtk4]
ags run --gtk4
```

:::

4. Learn [TypeScript in Y minutes](https://learnxinyminutes.com/docs/typescript/)

5. Read the [Astal Documentation](https://aylur.github.io/astal/guide/typescript/first-widgets) to start developing
