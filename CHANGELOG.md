# 1.8.2

## Features

- Calendar.detail
- SpinButton.range
- SpinButton.increments
- Network.frequency
- recursive Utils.monitorFile
- add: Network.vpn
- add write and writeAsync to Utils.subprocess (#388)

## Fixes

- compiles with typescript >= 5.0.4
- DrawingArea.draw-fn
- hyprland: active client empty on window close
- dispose signal on Variable
- skip unnecessary value setting in Utils.derive and Utils.merge
- properly log errors from Variables
- adjust Hyprland socket (#398)

## Breaking Changes

- Stream.is_muted corresponds to actual mute state
- Utils.exec returns stderr on error

# 1.8.0

## Features

- add: Utils.watch
- custom hookable objects
- add: App.config
- impove widget subclasses
  - Calendar.on_day_selected
  - ColorButton.on_color_set
  - DrawingArea.draw_fn
  - FileChooserButton.on_file_set
  - FontButton.on_font_set
  - LevelBar.vertical
  - LevelBar.bar_mode
  - Separator.vertical
  - SpinButton.on_value_changed
  - Spinner starts based on visibility
  - Switch.on_activate
  - ToggleButton.on_toggled
- print notification daemons's name when its already running

## Fixes

- Widget.attribute assign falsy values
- Overlay child type

## Breaking Changes

- revert: hyprland service: workspace and monitor signal emit number
- types: Label's and Icon's Props type renamed to LabelProps, IconProps
- deprecate: default export config object in favor of App.config

# 1.7.7

## Features

- App.addIcons, App.gtkTheme, App.cursorTheme, App.iconTheme
- add: Notifications.clearDelay
- add MprisPlayer.track_album
- add MprisPlayer.metadata
- add Widget.keybind
- App.applyCss takes stylesheets, and an optional reset parameter

## Fixes

- prepend icons from config instead of append
- Network.wifi.enabled signal
- Utils.merge connect to notify signal

## Breaking Changes

- deprecate: Window.popup

# 1.7.6

## Features

- Utils.writeFileSync
- add Utils.merge, Utils.derive
- add Binding.as alias for Binding.transform

## Fixes

- Stack.add_named
- Scrollable destroy child on destroy event

## Breaking Changes

- hyprland service: workspace and monitor signal emit number
- hyprland service: deprecate sendMessage, introduce message and messageAsync
- Variable: value check on setter, force on setValue
- `Utils.monitorFile()` no longer takes the `type` (`file` or `directory`) parameter. It will monitor each accordingly without specifying it.

# 1.7.5

## Features

- generate types for utils subdirectory (#287)
- export gobject utils in Utils
- bind service methods
- make App.closeWindowDelay writable

## Fixes

- widget: button, eventbox child second parameter

## Breaking Changes

- add: Stack.children
- deprecate: Stack.items

# 1.7.4

## Features

- add: Overlay.overlay Box.child
- add: params to Utils.fetch
- feat(circular-progress): end-at property (#239)
- feat(Utils.notify)
- feat(notifications): support every hint
- add: Widget.click-through (#245)
- feat: --init cli flag
- add: Widget.keymode
- improved types
- add: Window.gdkmonitor
- export modules globally
- make Audio.microphone and Audio.speaker always
- feat: greetd service (#282)
- feat(pam): Utils.authenticate (#273)
- feat: child property as second parameter [#265](https://github.com/Aylur/ags/pull/265/)

## Breaking Changes

- subclassing of widgets

## Fixes

- notifications: warn on non 8 bits image

# 1.6.3

## Features

- feat: Service.bind and Variable.bind
- feat: AgsWidget.register
- export Widget.createCtor utility
- add: Applications.reload
- add: Utils.idle
- use GLib.shell_parse_argv on Utils.execAsync
- feat: Utils.fetch
- overwrite toJSON method on GObjects
- feat: PowerProfile Service

## Breaking Changes

- update: Hyprland.active.monitor to be an object

# 1.5.5

## Features

- feat: support print from client with --run-js
- feat: support shebang with --run-file
- add: Utils.monitorFile
- feat: Utils.readFile and readFileAsync can take a Gio.File
- improve Button, EventBox hover events
- parse passed files starting with .
- feat: binds targetProp can be in kebab, camel or snake case too
- add: hook, on, poll, bind, attribute

# 1.5.4

## Features

- add: notificationForceTimeout option
- add: bluetooth device-added, device-removed signal
- add: cursor property
- feat: window popup close on click away
- add: config.onWindowToggled & config.onConfigParsed
- add: marks property setter to slider #186
- feat: --run-js async support
- add: --run-file

## Breaking Changes

- feat: Window.exclusivity
- deprecate: --run-promise cli flag

## Fixes

- overlay pass-through #168
