# Unreleased

## Features
- feat: Service.bind and Variable.bind
- feat: AgsWidget.register
- export Widget.createCtor utility

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
