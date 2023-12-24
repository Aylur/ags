This is the main `Gtk.Application` instance that is running.
## signals
* `window-toggled`: `(windowName: string, visible: boolean)`
* `config-parsed`: emitted on startup

## properties
* `windows`: `Gtk.Window[]`
* `configDir`: `string` path to the config directory

## methods
* `addWindow`: `(window: Gtk.Window) => void`
* `removeWindow`: `(window: Gtk.Window) => void`
* `getWindow`: `(name: string) => Gtk.Window`
* `closeWindow`: `(name: string) => void`
* `openWindow`: `(name: string) => void`
* `toggleWindow`: `(name: string) => void`
* `quit`: `() => void`
* `resetCss`: `() => void`
* `applyCss`: `(path: string) => void`

# Window toggled signal
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

// this is only signaled for windows exported in config.js
// or added with App.addWindow
const label = Widget.Label()
    .hook(App, (self, windowName, visible) => {
        self.label = `${windowName} is ${visible ? 'visible' : 'not visible'}`;
    }, 'window-toggled')
});
```

# Applying CSS
If you want to change the style sheet on runtime
```js
import App from 'resource:///com/github/Aylur/ags/app.js';

// if you apply multiple, they are all going to apply on top of each other
App.applyCss('path-to-file');

// to reset applied stylesheets
App.resetCss();
```
