# Installation

## Arch

maintainer: [@kotontrion](https://github.com/kotontrion)

```sh
yay -S aylurs-gtk-shell-git
```

## Nix

maintainer: [@Aylur](https://github.com/Aylur)

```sh
nix shell github:aylur/ags
```

Read more about running AGS on [Nix](./nix)

## From Source

1. Install these three
   [Astal packages](https://aylur.github.io/astal/guide/getting-started/installation)

   - astal-io
   - astal3
   - astal4

2. Install dependencies

   :::code-group

   ```sh [<i class="devicon-archlinux-plain" /> Arch]
   sudo pacman -Syu \
       meson ninja go gobject-introspection \
       gtk3 gtk-layer-shell \
       gtk4 gtk4-layer-shell
   ```

   ```sh [<i class="devicon-fedora-plain" /> Fedora]
   sudo dnf install \
       meson ninja golang gobject-introspection-devel \
       gtk3-devel gtk-layer-shell-devel \
       gtk4-devel gtk4-layer-shell-devel
   ```

   :::

3. Clone and install AGS

   ```sh
   git clone --recurse-submodules https://github.com/aylur/ags
   meson setup build
   meson install -C build
   ```
