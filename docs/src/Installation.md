## Nix
maintainer: [@Aylur](https://github.com/Aylur)

You can use the [Home Manager module](Home-Manager.md)

or use nix flake profile install
```bash
nix profile install github:Aylur/ags
```

or try it without installing
```bash
nix run github:Aylur/ags
```

## Arch
maintainer: [@kotontrion](https://github.com/kotontrion)
```bash
yay -S aylurs-gtk-shell # or aylurs-gtk-shell-git
```

## Fedora
maintainer: [@mrhyperbit](https://github.com/mrhyperbit)
```bash
sudo dnf copr enable solopasha/hyprland
sudo dnf install aylurs-gtk-shell
```
## From source

```bash
# Arch
sudo pacman -S typescript npm meson gjs gtk3 gtk-layer-shell gnome-bluetooth-3.0 upower networkmanager gobject-introspection libdbusmenu-gtk3
```

```bash
# Fedora
sudo dnf install typescript npm meson gjs-devel gtk3-devel gtk-layer-shell gnome-bluetooth upower NetworkManager pulseaudio-libs-devel libdbusmenu-gtk3
```

```bash
# Ubuntu
sudo apt install node-typescript npm meson libgjs-dev gjs libgtk-layer-shell-dev libgtk-3-dev libpulse-dev network-manager-dev libgnome-bluetooth-3.0-dev libdbusmenu-gtk3-dev
```

```bash
# clone, build, install
git clone --recursive https://github.com/Aylur/ags.git
cd ags
npm install
meson setup build
meson install -C build
```

## Running
```bash
ags --help
```
