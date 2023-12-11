## signals
* `changed` should emit when an app is installed or uninstalled but doesn't always work

## methods
* `query`: `(string) => App[]` takes a string and returns a list of apps that match one of the following: app name, app description, executable name or .desktop file.

## properties
* `list`: `App[]` a full list of available applications

### Application
#### properties
* `app`: [Gio.DesktopAppInfo](https://gjs-docs.gnome.org/gio20~2.0/gio.desktopappinfo) the corresponding app info object
* `name`: `string` name of the app
* `desktop`: `string | null` the .desktop file
* `description`: `string | null` description of the app
* `executable`: `string` name of the executable binary
* `icon-name`: `string` the Icon entry in the corresponding .desktop file, can be a named icon or a path to an image
* `frequency`: 'number' number to take into consideration when sorting on `query` calls

#### methods
* `launch`: `() => void` launches the app, you could also do `Utils.execAsync(['bash', '-c', app.executable])`, but the launch method keeps track of the frequency of launches which is used to sort the query
* `match`: `(string) => boolean`: returns wether a search term matches the app

## [Example Applauncher](https://github.com/Aylur/ags/tree/main/example/applauncher)
