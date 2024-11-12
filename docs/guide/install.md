# Installation

## Arch

maintainer: [@kotontrion](https://github.com/kotontrion)

```sh [<i class="devicon-archlinux-plain"></i> Arch]
yay -S aylurs-gtk-shell-git
```

## Nix

maintainer: [@Aylur](https://github.com/Aylur)

Read more about it on the [nix page](./nix)

## From Source

1. Install [Astal](https://aylur.github.io/astal/guide/getting-started/installation)

2. Install the Astal js package

```sh [<i class="devicon-linux-plain"></i> From Source]
git clone https://github.com/aylur/astal
cd astal/lang/gjs
meson setup --prefix /usr build
meson install -C build
```

2. Install AGS

```sh [<i class="devicon-linux-plain"></i> From Source]
# Install AGS
git clone https://github.com/aylur/ags.git
cd ags
go build
```
