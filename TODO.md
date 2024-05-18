# Planned features/improvements

- services
  - [x] power profiles [#218](https://github.com/Aylur/ags/pull/218)
  - [x] greetd [#282](https://github.com/Aylur/ags/pull/282)
  - [ ] evolution data server - allows for to sync with calendars, todos and contact lists
  - [ ] improve Network service - its currently very barebones, and state changes are not properly signaled

- utility gobject based library in c
  - [x] pam module [#273](https://github.com/Aylur/ags/pull/273)
  - [ ] ext-session-lock

- [x] fetch util function [#187](https://github.com/Aylur/ags/pull/187)
- [x] toJSON overridies [#203](https://github.com/Aylur/ags/pull/203)

- [ ] circular slider widget

- subclass more widget
  - [ ] Gtk.Fixed
  - [ ] Gtk.Grid

- Nix
  - [ ] NixOS module
  - [x] binary cache [#212](https://github.com/Aylur/ags/pull/212)

- package generated types and @gir types
  - [ ] ~~github action to package types~~
  - [x] install them at ~~/etc/ags~~ pkgdatadir/share with meson
  - [x] `--init` cli flag

- Wiki
  - [x] update to use `bind` `hook` `on` `poll`
  - [x] update examples
  - [x] Frequent GTK issues page
    - [x] Single children issues

  - [x] Move wiki to aylur.github.io/ags
    - ~~maybe? rename id from com.github.Aylur.ags to io.Aylur.ags~~

- [ ] add JSDoc to most stuff
