A Service is an instance of a [GObject.Object](https://gjs-docs.gnome.org/gobject20~2.0/gobject.object) that emits signals when its state changes. Widgets can connect to them and execute a callback function on their signals which are usually functions that updates the widget's properties.

```js
const widget = Widget.Label()
    // the signal is 'changed' if not specified
    // [Service, callback, signal = 'changed']
    .hook(SomeService, function(self, ...args) {
        // there can be other arguments based on signals
        self.label = 'new label';
    }, 'changed')

    // [prop, Service, targetProp, transfrom = out => out]
    .bind('label', SomeService, 'service-prop', function(serviceProp) {
        return `transformed ${serviceProp}`
    })
```

Services can be also connected to outside of widgets
```js
SomeService.connect('changed', (service, ...args) => {
    print(service, ...args);
});
```

# List of builtin services

> [!IMPORTANT]
> Import `default` and don't import the service class from the module, unless you need the type when using typescript.
```js
// this is the service instance
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

// this is also the same instance
import { battery } from 'resource:///com/github/Aylur/ags/service/battery.js';

// DON'T import it this way, this is the class
import { Battery } from 'resource:///com/github/Aylur/ags/service/battery.js';
```

> [!NOTE]
> Every service has a `"changed"` signal which is emitted on any kind of state change, unless stated otherwise.

* [Applications](Applications.md)
* [Audio](Audio.md)
* [Battery](Battery.md)
* [Bluetooth](Bluetooth.md)
* [Hyprland](Hyprland.md)
* [Mpris](Mpris.md)
* [Network](Network.md)
* [Notifications](Notifications.md)
* [SystemTray](SystemTray.md)
