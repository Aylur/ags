A Service is an instance of a [GObject.Object](https://gjs-docs.gnome.org/gobject20~2.0/gobject.object) that emits signals when its state changes. Widgets can connect to them and execute a callback function on their signals which are usually functions that updates the widget's properties.

```js
const widget = Widget.Label({
    // there can be any number of connections and binds
    connections: [
        // the signal is 'changed' if not specified
        // [Service, callback, signal = 'changed']

        // using the function keyword
        [SomeService, function(self, ...otherArgs) {
            // self is a reference to the widget instance
            self.label = 'new label';

            // there can be other arguments based on signals
        }],

        // using a lambda function
        [SomeService, (self, ...otherArgs) => {
            self.label = 'new label';
        }]
    ],

    // binds are connections, that connect to the 'notify::service-prop' signal
    binds: [
        // [selfProp, Service, targetProp, transfromMethod = function(out) { return out; }]

        // sets self.selfProp to SomeService.serviceProp on notify::service-prop signal
        ['self-prop', SomeService, 'service-prop']
    ],

    // this is what the bind above translates to
    connections: [
        [SomeService, function(self, serviceProp) {
            self.selfProp = serviceProp;
        }, 'notify::service-prop']
    ]
});
```

you can also connect to signals outside of widgets
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

# Writing custom Services

This is an example Service for backlight using `brightnessctl` to set the brightness and `Utils.monitorFile` to watch for changes.
```js
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

class BrightnessService extends Service {
    // every subclass of GObject.Object has to register itself
    static {
        // takes three arguments
        // the class itself
        // an object defining the signals
        // an object defining its properties
        Service.register(
            this,
            {
                // 'name-of-signal': [type as a string from GObject.TYPE_<type>],
                'screen-changed': ['float'],
            },
            {
                // 'kebab-cased-name': [type as a string from GObject.TYPE_<type>, 'r' | 'w' | 'rw']
                // 'r' means readable
                // 'w' means writable
                // guess what 'rw' means
                'screen-value': ['float', 'rw'],
            },
        );
    }

    // this Service assumes only one device with backlight
    #interface = Utils.exec("sh -c 'ls -w1 /sys/class/backlight | head -1'");

    // # prefix means private in JS
    #screenValue = 0;
    #max = Number(Utils.exec('brightnessctl max'));

    // the getter has to be in snake_case
    get screen_value() {
        return this.#screenValue;
    }

    // the setter has to be in snake_case too
    set screen_value(percent) {
        if (percent < 0)
            percent = 0;

        if (percent > 1)
            percent = 1;

        Utils.execAsync(`brightnessctl set ${percent * 100}% -q`)
        // the file monitor will handle the rest
    }

    constructor() {
        super();

        // setup monitor
        const brightness = `/sys/class/backlight/${this.#interface}/brightness`;
        Utils.monitorFile(brightness, () => this.#onChange());

        // initialize
        this.#onChange();
    }

    #onChange() {
        this.#screenValue = Number(Utils.exec('brightnessctl get')) / this.#max;

        // signals have to be explicity emitted
        this.emit('changed'); // emits "changed"
        this.notify('screen-value'); // emits "notify::screen-value"

        // or use Service.changed(propName: string) which does the above two
        // this.changed('screen-value');

        // emit screen-changed with the percent as a parameter
        this.emit('screen-changed', this.#screenValue);
    }

    // overwriting the connect method, let's you
    // change the default event that widgets connect to
    connect(event = 'screen-changed', callback) {
        return super.connect(event, callback);
    }
}

// export to use in other modules
export default service;
```

> [!IMPORTANT]
> For `binds` to work, the property has to be defined in `Service.register`

Using it with widgets is as simple as using the builtin ones.

```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Brightness from './brightness.js';

const slider = Widget.Slider({
    on_change: self => service.screen_value = self.value,
    binds: [['value', service, 'screen-value']],
});

const label = Label({
    binds: [
        ['label', Brightness, 'screen-value', v => `${v}`],
    ],

    connections: [
        [Brightness, (self, screenValue) => {
            // screenValue is the passed parameter from the 'screen-changed' signal

            // NOTE:
            // since connections are run upon construction
            // the passed screenValue will be undefined the first time

            // all three are valid
            self.label = `${Brightness.screenValue}`;
            self.label = `${Brightness.screen_value}`;
            self.label = `${Brightness['screen-value']}`;
        }],
    ]
});
```
