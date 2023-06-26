# Aylur's Gtk Shell

This is basically a toolkit I wrote so that I can declaratively define Gtk widgets in javascript.
The goal of this project is to be something like [EWW](https://github.com/elkowar/eww), but offer predifined components instead of barebone widgets, so that you don't have to build your desktop from scratch, but still have the option to build custom components.

I will make a wiki, but for now if you want to try it out your only documentation is the source code.

## Install

```bash
# dependencies
# Arch
yay -S gjs gtk3 socat gnome-bluetooth-3.0 upower networkmanager
# Fedora
sudo dnf install gjs gtk3 socat gnome-bluetooth upower NetworkManager
# build and install
meson setup build
meson install -C build
```

## Plans

- [ ] Lockscreen
- [ ] Display manager (maybe?)

### Widgets

- Basics:
    - [x] Box
    - [x] Button
    - [x] CenterBox
    - [ ] CircularProgress
    - [x] Dynamic
    - [x] Entry
    - [x] EventBox
    - [x] Icon
    - [x] Label
    - [x] Overlay
    - [ ] ProgressBar
    - [x] Revealer
    - [x] Scrollable
    - [x] Slider
- [x] App launcher
- Audio
    - [x] Indicator
    - [x] Speaker Slider
    - [x] Mic mute toggle
    - [x] Applications Mixer
- [x] Battery
- Bluetooth
    - [x] Indicator
    - [x] Toggle
    - [ ] Connections
- [x] Clock
- Hyprland:
    - [x] Workspaces
    - [x] Active client indicator
    - [x] Taskbar
    - [ ] Overview
- [x] Mpris
- Network
    - [x] SSID label
    - [x] Wifi strength
    - [x] Wifi, Wired, Indicator
    - [x] Wifi toggle
    - [ ] Connections
- [x] Notifications
- [ ] Tray
