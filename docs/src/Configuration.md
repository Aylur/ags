Prerequisites: [JavaScript](JavaScript.md)

Start by creating `~/.config/ags/config.js` with the following contents:
```js
export default {
    windows: [
        // this is where window definitions will go
    ]
}
```

then run `ags` in the terminal
```bash
ags
```

You will see nothing happen, just AGS hanging, this is because you have an empty config. Running `ags` will execute the config like a regular script, it is just a library over GTK, and its on **you** to program your windows and widgets.
## GTK

First let's make a window with some text on it.
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';

const myLabel = Widget.Label({
    label: 'some example content',
})

const myBar = Widget.Window({
    name: 'bar',
    anchor: ['top', 'left', 'right'],
    child: myLabel,
})

export default { windows: [myBar] }
```

> [!NOTE]
> GObject properties can be accessed or set in multiple ways: with `camelCase`, `snake_case`, and `kebab-case`

```js
// all three are valid
const w = Widget.Label({
    className: 'my-label',
    class_name: 'my-label',
    'class-name': 'my-label',
});

w.className = ''
w.class_name = ''
w['class-name'] = ''

w['className'] = ''
w['class_name'] = ''
```

That will show a bar on top with some static text. Both `myLabel` and `myBar` constants we declared are a single instance of a `Gtk.Widget`. What if you have two monitors and want to have a bar for each? Make a function that returns a `Gtk.Widget` instance.
```js
function Bar(monitor = 0) {
    const myLabel = Widget.Label({
        label: 'some example content',
    })
    
    const win = Widget.Window({
        monitor,
        // name has to be unique
        name: `bar${monitor}`,
        anchor: ['top', 'left', 'right'],
        child: myLabel,
    })

    return win
}

export default { windows: [Bar(0), Bar(1)] }
```

> [!NOTE]
> The `name` attribute only has to be unique, if you pass it to `windows` in the exported object.

> [!IMPORTANT]
> Calling `Widget.Window` will create and show the window by default. You don't necessarily have to pass a reference to `windows` in the exported object, but if you don't, you won't be able to toggle it with `ags --toggle-window`

Alright, but static text is boring, let's make it dynamically change by updating the label every second with a `date`.
```js
import { interval, exec } from 'resource:///com/github/Aylur/ags/utils.js';

function Bar(monitor = 0) {
    const myLabel = Widget.Label({
        label: 'some example content',
    })

    interval(1000, () => {
        myLabel.label = exec('date')
    })
    
    const win = Widget.Window({
        monitor,
        name: `bar${monitor}`,
        anchor: ['top', 'left', 'right'],
        child: myLabel,
    })

    return win
}
```

> [!NOTE]  
> JavaScript is **single threaded** and `exec` is a **blocking operation**, for a `date` call it's fine, but usually you want to use its **async** version: `execAsync`.

Looking great, but that code has too much boilerplate for my taste. Let's use a [fat arrow](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
instead of the `function` keyword, and instead of calling `interval` let's use the `connection` property.
```js
const Bar = (monitor = 0) => Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: ['top', 'left', 'right'],
    child: Widget.Label({
        connections: [
            [1000, self => { self.label = exec('date') }],
        ]
    })
})
```

We usually want to avoid polling, the less intervals the better. This is where `GObject` shines. We use signals for pretty much everything.
```js
import Variable from 'resource:///com/github/Aylur/ags/variable.js';

// anytime myVariable.value changes
// it will send a signal
const myVariable = Variable(0)

myVariable.connect('changed', ({ value }) => {
    print('myVariable changed to ' + `${value}`)
})

const bar = Widget.Window({
    name: 'bar',
    child: Widget.Label({
        connections: [[myVariable, self => {
            self.label = `${myVariable.value}`
        }]]
    })
})

myVariable.value++
myVariable.value++
myVariable.value++
```

For example with `pactl` you can get information about the volume level, but you don't want to have an interval that checks it periodically. You want a signal that signals everytime its **changed**, so you only do operations when its needed. `pactl subscribe` writes to stdout everytime there is a change.

```js
const pactl = Variable({ count: 0, msg: '' }, {
    listen: ['pactl subscribe', msg => ({
        count: pactl.value.count + 1,
        msg: msg,
    })]
})

pactl.connect('changed', ({value}) => {
    print(value.msg, value.count)
})

const label = Widget.Label({
    connections: [[pactl, self => {
        const { count, msg } = pactl.value
        self.label = `${msg} ${count}`
    }]]
})

// widgets are GObjects too
label.connect('notify::label', ({ label }) => {
    print('label changed to ', label)
})
```

For *most* of your system, you don't have to use external scripts and binaries to query information. AGS has builtin [Services](Service.md). They are just like `Variables` but instead of a single `value` they have more attributes and methods on them.
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

const batteryProgress = Widget.CircularProgress({
    className: 'progress',
    child: Widget.Icon({
        binds: [['icon', Battery, 'icon-name']],
    }),
    connections: [[Battery, self => {
        self.value = Battery.percent / 100;
    }]]
})
```

## CSS

So far every widget you made used your default gtk3 theme. To make them more custom, you can apply stylesheets to them, which are either imported `css` files or inline css applied with the `css` property.
```js
import App from 'resource:///com/github/Aylur/ags/app.js';

export default {
    // this style attribute takes a full path
    style: '/home/username/.config/ags/style.css',

    // you can get the current config directory through App
    style: App.configDir + '/style.css',
}
```

> [!IMPORTANT]  
> GTK is **not the web**, while most features are also implemented in GTK, you can't assume anything that works on the web will work with GTK. Refer to the [GTK docs](https://docs.gtk.org/gtk3/css-overview.html) to see what is available.

## Config object

When you start `ags`, it will try to `import` the `default` `export` from a module which defaults to `~/.config/ags/config.js`. Even if you mutate this object after initialization, the config **will not be reloaded**.

```js
export default {
    closeWindowDelay: {
        'window-name': 500, // milliseconds
    },
    notificationPopupTimeout: 5000, // milliseconds
    notificationForceTimeout: false,
    cacheNotificationActions: false,
    maxStreamVolume: 1.5, // float
    cacheCoverArt: true,

    style: App.configDir + '/style.css',
    windows: [
        // Array<Gtk.Window>
    ],
}
```

## The exported config object

| Field | Type | Description |
|-------|------|-------------|
| `closeWindowDelay` | `Record<string, number>` | delays the closing of a window, this is useful for making animations with a revealer
| `notificationPopupTimeout` | `number` | how long should a notification be flagged for popup
| `notificationForceTimeout` | `boolean` | force `notificationPopupTimeout` and ignore timeout set by notifications
| `cacheNotificationActions` | `boolean` | whether to cache notification actions, so that they can be reloaded
| `maxStreamVolume` | `number` | maximum possible volume on an Audio Stream
| `cacheCoverArt` | `boolean` | whether to cache mpris cover arts. `true` by default 
| `style` | `string` | path to a css file.
| `windows` | `Array<Gtk.Window>` list of [Windows](Basic-Widgets.md#window).
