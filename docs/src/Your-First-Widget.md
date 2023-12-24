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
        name: `bar${monitor}`, // this name has to be unique
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
> Calling `Widget.Window` will create and show the window by default. You don't necessarily have to pass a reference to `windows` in the exported object, but if you don't, you won't be able to toggle it with `ags --toggle-window` or through `App.toggleWindow`

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
instead of the `function` keyword, and instead of calling `interval` let's use the `poll` method.
```js
const Bar = (monitor = 0) => Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: ['top', 'left', 'right'],
    child: Widget.Label()
        .poll(1000, label => label.label = exec('date'))
})
```

> [!NOTE]
>That is still not the best solution, because when you create multiple instances of `Bar` each will call `exec`. What you want to do is, move the date into a `Variable` and `bind` it.
```js
import Variable from 'resource:///com/github/Aylur/ags/variable.js';

const date = Variable('', {
	poll: [1000, 'data']
})

const Bar = () => Widget.Window({
    child: Widget.Label()
        .bind('label', date)
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
    child: Widget.Label()
        .bind('label', myVariable, 'value', v => `value: ${v}`)
})

myVariable.value++
myVariable.value++
myVariable.value++
```

For example with `pactl` you can get information about the volume level, but you don't want to have an interval that checks it periodically. You want a **signal** that signals every time its **changed**, so you only do operations when its needed. `pactl subscribe` writes to stdout everytime there is a change.

```js
const pactl = Variable({ count: 0, msg: '' }, {
    listen: ['pactl subscribe', msg => ({
        count: pactl.value.count + 1,
        msg: msg,
    })]
})

pactl.connect('changed', ({ value }) => {
    print(value.msg, value.count)
})

const label = Widget.Label()
    .bind('label', pactl, 'value', ({ count, msg }) => {
        return `${msg} ${count}`
    })

// widgets are GObjects too
label.connect('notify::label', ({ label }) => {
    print('label changed to ', label)
})
```

For *most* of your system, you don't have to use external scripts and binaries to query information. AGS has builtin [Services](Service.md). They are just like [Variables](Variable.md) but instead of a single `value` they have more attributes and methods on them.
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

const batteryProgress = Widget.CircularProgress({
    value: Battery.bind('percent').transform(p => p / 100),
    child: Widget.Icon({
        icon: Battery.bind('icon_name'),
    })
})
```
