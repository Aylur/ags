# Planned features/improvements

- services
  - [ ] power profiles
  - [ ] greetd - this would allow to create login managers
  - [ ] evolution data server - allows for to sync with calendars, todos and contact lists
  - [ ] improve Network service - its currently very barebones, and state changes are not properly signaled

- [ ] utility gobject based library in c
  - to be able to use wayland protocols especially for lockscreens in the form of a PAM util function for authentication and input inhibitor

- [ ] fetch util function
  - we can currently use `curl` or `wget` but a fetch like the web api would be useful

- [ ] toJSON overridies
  - currently logging with `JSON.stringify` isn't very useful

- [ ] circular slider widget

- subclass more widget
  - [ ] Gtk.Fixed
  - [ ] Gtk.Grid

- Nix
  - [ ] NixOS module
  - [x] binary cache [#212](https://github.com/Aylur/ags/pull/212)

- [ ] github action to package types 
  - [ ] maybe? install them at /etc/ags with meson

- Wiki
  - [ ] Frequent GTK issues page
    - [ ] Single children issues

  - [ ] Move wiki to aylur.github.io/ags
    - maybe? rename id from com.github.Aylur.ags to io.Aylur.ags

