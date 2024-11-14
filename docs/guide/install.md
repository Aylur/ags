# Installation

## Arch

maintainer: [@kotontrion](https://github.com/kotontrion)

```sh
yay -S aylurs-gtk-shell
```

## Nix

maintainer: [@Aylur](https://github.com/Aylur)

Read more about it on the [nix page](./nix)

## From Source

1. Install [Astal](https://aylur.github.io/astal/guide/getting-started/installation)

2. Install the Astal js package

```sh
git clone https://github.com/aylur/astal
cd astal/lang/gjs
meson setup --prefix /usr build
meson install -C build
```

2. Install AGS

```sh
git clone https://github.com/aylur/ags.git
cd ags

go install -ldflags "\
    -X 'main.gtk4LayerShell=$(pkg-config --variable=libdir gtk4-layer-shell-0)/libgtk4-layer-shell.so' \
    -X 'main.astalGjs=$(pkg-config --variable=srcdir astal-gjs)'"
```

:::tip
`go install` will install to `$GOPATH/bin/ags` or `$HOME/go/bin/ags`.
You might wish to move the binary to more traditional linux directories.

```sh
sudo mv $GOPATH/bin/ags /usr/bin/ags
mv $GOPATH/bin/ags ~/.local/bin/ags
```

:::
