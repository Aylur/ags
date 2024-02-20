# 1.7.7

## Features

- App.addIcons, App.gtkTheme, App.cursorTheme, App.iconTheme
- add: Notifications.clearDelay
- add MprisPlayer.track_album
- add MprisPlayer.metadata
- add Widget.keybind

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
