We have used `poll` and `bind` so far to make widgets have content dynamically. There is also `on` and `hook` methods.

You can call these on any Widget that you have a reference on. They will return `this` reference, meaning you can chain them up in any order in any number.
```js
const widget = Widget()
widget.hook()
widget.bind()
```

```js
const widget = Widget()
    .hook()
    .bind()
```

```js
const widget = Widget({
    setup: self => {
        self.bind()
        self.hook()
    }
})
```

```js
const widget = Widget({
    setup: self => self
        .bind()
        .hook()
})
```

## Hook
`hook` will setup a listener to a `GObject` and will handle disconnection when the widget is destroyed. It will connect to the `changed` signal by default when not specified otherwise.
```js
// .hook(GObject, callback, signal?)
const BatteryPercent = () => Label()
    .hook(Battery, label => {
        label.label = `${Battery.percent}%`
        label.visible = Battery.available
    }, 'changed')
```
## Bind
`bind` can be directly translated to `hook`. It will setup a listener based on property changes
```js
const label = Label()

label.bind(
    'label', // self property to bind
    Battery, // GObject to listen to
    'percent', // target property
    p => `${p}%`) // optional transform method

// translates to
label.hook(
    Battery,
    self => self['label'] = `${Battery['percent']}%`,
    'notify::percent')
```

It is also possible to call `bind` on [Services](Service.md)  and [Variables](Variable.md) that can be used inside constructors.
```js
Label({
    label: Battery
        .bind('percent')
        .transform(p => `${p}%`)
})
```

```js
const text = Variable('hello')

Label({
    label: text
        .bind()
        .transform(v => `transformed ${v}`)
})
```

## On
`on` is the same as `connect` but instead of the signal handler id, it returns a reference to the widget. `on` will setup a callback on a widget signal.

These two are equivalent
```js
function MyButton() {
    const self = Widget.Button()
    
    self.connect('clicked', () => {
        print(self, 'is clicked')
    })

    return self
}
```

```js
const MyButton = () => Widget.Button()
    .on('clicked', self => {
        print(self, 'is clicked')
    })
```

## Poll
Avoid using this as much as possible, using this is considered bad practice.

These two are equivalent
```js
function MyLabel() {
    const self = Widget.Label()
    
    Utils.interval(1000, () => {
        self.label = Utils.exec('date')
    }, self)

    return self
}
```

```js
const MyLabel = () => Widget.Label()
    .poll(1000, self => {
        self.label = Utils.exec('date')
    })
```
