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

## Fedora

maintainer: [@solopasha](https://github.com/solopasha)

```sh
sudo dnf copr enable solopasha/hyprland
sudo dnf install aylurs-gtk-shell2
```

## From Source

1. Install these three
   [Astal packages](https://aylur.github.io/astal/guide/installation)

   - astal-io
   - astal3
   - astal4

2. Install dependencies

   :::code-group

   ```sh [<i class="devicon-archlinux-plain" /> Arch]
   sudo pacman -Syu \
       npm meson ninja go gobject-introspection \
       gtk3 gtk-layer-shell \
       gtk4 gtk4-layer-shell
   ```

   ```sh [<i class="devicon-fedora-plain" /> Fedora]
   sudo dnf install \
       npm meson ninja golang gobject-introspection-devel \
       gtk3-devel gtk-layer-shell-devel \
       gtk4-devel gtk4-layer-shell-devel
   ```

   :::

3. Clone and install AGS

   ```sh
   git clone https://github.com/aylur/ags.git
   cd ags
   npm install
   meson setup build
   meson install -C build
   ```

> [!IMPORTANT]
>
> By default, meson installs to `/usr/local`.
