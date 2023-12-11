`Widget` functions return an instance of [Gtk.Widget](https://gjs-docs.gnome.org/gtk30~3.0/gtk.widget). Most common widgets are subclassed and have a few additional properties.

[List of builtin widget](Basic-Widgets.md)

These widgets have some additional properties on top of the base Gtk.Widget one:

| Property | Type | Description |
|----------|------|-------------|
| class-name | string | List of class CSS selectors separated by white space.
| class-names | string[] | List of class CSS selectors.
| css | string | Inline CSS. e.g `label { color: white; }`. If no selector is specifed `*` will be assumed. e.g `color: white;` will be inferred as `*{ color: white; }`.
| hpack | string | Horizontal alignment, behaves like `halign`. `halign` takes an enum, but for convenience `hpack` can be given with a string, so one of `"start"`, `"center"`, `"end"`, `"fill"`.
| vpack | string | Vertical alignment.
| cursor | string | Cursor style when hovering over widgets that have hover states, e.g it won't work on labels. [list of valid values](https://docs.gtk.org/gdk3/ctor.Cursor.new_from_name.html).
| properties | tuple[] | Read below.
| connections | connection[] | Read below.
| binds | bind[] | Read below.
| setup | (self) => void | Read below.

Some common Gtk.Widget properties you might want for example

| Property | Type | Description |
|----------|------|-------------|
| hexpand | boolean  | Expand horizontally.
| vexpand | boolean |  Expand vertically.
| sensitive | boolean | Makes the widget interactable.
| tooltip-text | string | Tooltip popup when the widget is hovered over.
| visible | boolean | Visibility of the widget. Setting this to `false` doesn't have any effect if the parent container calls `show_all()`, for example when you set a Box's childen dynamically.

### Connections

```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Gtk from 'gi://Gtk';
```

Let's say you want a label that shows the current volume level, this is how you would do it with Gtk
```js
const MyLabelImperative = () => {

    // make the label and initalize its text
    const label = new Gtk.Label({
        label: `${Audio.speaker.volume * 100}%`,
    });

    // connect to Audio Service so whenever it updates we update the label's text
    const id = Audio.connect('speaker-changed', () => {
        label.label = `${Audio.speaker?.volume * 100}%`;
    });

    // disconnect if the label gets destroyed
    label.connect('destroy', () => Audio.disconnect(id));

    // return the label
    return label;
};
```

↑ That looks kind of ugly so lets use Widget.Label and connections property instead
```js
const MyLabelDeclarative = () => Widget.Label({
    // no need to initalize it with the label property
    label: `${Audio.speaker.volume * 100}%`, // unnecessary

    // connections sets up the connect, disconnect and calls the function
    connections: [
        // [Service, callback, event] event is 'changed' by default
        [Audio, self => {
            // this gets run whenever Audio signals 'speaker-changed'
            self.label = `${Audio.speaker?.volume * 100}%`;
        }, 'speaker-changed'],
    ],
});
```

The connection can also be a `['signal', callback]` where the signal is the name of a signal that the widget emits, e.g when a button is clicked it emits the 'clicked' signal
```js
const myButton = Widget.Button({
    connections: [
        ['clicked', self => { /*do something*/ }],
    ],
});
```

Or a `[number, callback]` which sets up a poll
```js
const clock = Widget.Label({
    // will run immediately upon construction and every second
    connections: [[1000, self => self.label = exec('date')]],
});
```

### Binds
A bind is a simple connection that updates a widget's property with another object's property.

```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
```

```js
const label = Widget.Label({
    binds: [
        [
            'label', // selfProp: string
            Battery, // targetObject: GObject.Object
            'percent', // targetProp: string "value" by default
            percent => `${percent}%`, // transform: (val) => val
        ],
    ],

    // this is what it translates to
    connections: [
        [
            Battery,
            self => self['label'] = `${Battery['percent']}%`,
            'notify::percent',
        ],
    ],
});
```

> [!IMPORTANT]
> The `targetProp` parameter has to be in `kebab-case`.

```js
const icon = Widget.Icon({
    binds: [
        // selfProp can be in kebab-case snake_case or camelCase
        // but targetProp has to be in kebab-case
        ['icon', Battery, 'icon-name'],
    ],
});
```

### Properties

Let's make a button that counts the times it was clicked.
```js
const CounterButton = () => {
    let count = 0;

    return Button({
        child: Label(`${count}`),
        onClicked: button => {
            count++;
            button.child.label = `${count}`;
        },
    });
};
```

Using `properties`
```js
const counter2 = Button({
    properties: [
        ['count', 0],
    ],
    child: Label('0'),
    onClicked: button => {
        button._count++;
        button.child.label = `${button._count}`;
    },
});
```

> [!IMPORTANT]
> You can set any property on any object (which is a blessing and a curse on dynamic languages like JS).
> Make sure that the property you are trying to set is not something predefined for Gtk.Widget like Gtk.Label's label property. Prefixing with an underscore is good practice to avoid conflicts.

```js
const label = Label({
    // this is label._label
    properties: [
        ['label', 'hi mom'],
    ],
    // this is label.label
    label: 'hi mom',
});
```

### Setup
The setup prop is useful when you want to nest widgets and also do something imperatively.
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from 'gi://Gtk';

const nested = Widget.Box({
    children: [
        Widget.Label('nested example'),
        Widget.SpinButton({
            setup: self => {
                // range can be only set like this
                self.set_range(0, 100);
                self.set_increments(1, 5);
            },
        }),
    ],
});
```

### Using Gtk.Widgets not builtin
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from 'gi://Gtk';
```

Use them like a regular GTK widget
```js
const calendar = new Gtk.Calendar({
    showDayNames: false,
    showHeading: true,
});
```

You can subclass Gtk.Widgets not builtin to behave like AGS widgets.
```js
const Calendar = Widget.subclass(Gtk.Calendar)

const calendar1 = Calendar({
    showDayNames: false,
    showHeading: true,
    // now you can set AGS props
    connections: [/* */],
    className: '',
});
```

> [!NOTE]
> Open up an issue/PR if you want to see a widget to be builtin.
## Methods

If you don't want to mutate the `classNames` array, there is `toggleClassName`: `(name: string, enable: boolean) => void`
```js
const label = Widget.Label('example-label')

// add class name
label.toggleClassName('my-awesome-label', true)

// remove class name
label.toggleClassName('my-awesome-label', false)
```

Adding connections and binds after construction
```js
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

const label = Widget.Label()

label.bind('label', Battery, 'percent', p => p / 100)

label.connectTo(Battery, self => self.label = Battery.percent / 100)
```

## Custom Widgets
Usually in GTK custom widgets are achieved by subclassing. The idea behind AGS is to use functions that create widgets and utilize [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures).
```js
function CounterButton(({ color = 'aqua', ...rest })) {
    let count = 0;

    const label = Widget.Label({
        label: '0',
        style: `color: ${color}`,
    });

    return Widget.Button({
        ...rest, // spread passed parameters
        child: label,
        onClicked: () => {
            label.label = `${count++}`;
        }
    })
}

// or like this
const CounterButton = ({ color = 'aqua', ...rest }) => Button({
    ...rest,
    properties: [['count', 0]],
    child: Label({
        label: '0',
        style: `color: ${color}`,
    }),
    onClicked: self => {
        self.child.label = `${self._count++}`;
    },
});

// then simply call it
const button = CounterButton({
    color: 'blue',
    className: 'my-widget',
});
```

This approach comes with the limitation that parameters passed to these functions are that, just parameters and not `GObject` properties. If you still want to subclass, you can do so by subclassing `AgsWidget`.
```js
import AgsWidget from 'resource:///com/github/Aylur/ags/widgets/widget.js';

class CounterButton extends AgsWidget(Gtk.Button, 'CounterButton') {
    static {
        GObject.registerClass({
            GTypeName: 'CounterButton',
            Properties: {
                'count': GObject.ParamSpec.int64(
                    'count', 'Count', 'The counting number',
                    GObject.ParamFlags.READWRITE,
                    Number.MIN_SAFE_INTEGER,
                    Number.MAX_SAFE_INTEGER,
                    0,
                ),
            },
        }, this);
    }

    // if you define the ParamSpec
    // the super constructor will take care of setting the count prop
    // so you don't have to explicitly set count in the constructor
    constructor(props) {
        super(props);

        const label = new Gtk.Label({
            label: `${this.count}`,
        });

        this.add(label);

        this.connect('clicked', () => {
            this.count++;
            label.label = `${this.count}`;
        });
    }

    get count() {
        return this._count || 0;
    }

    set count(num) {
        this._count = num;
        this.notify('count');
    }
}
```

You can now construct it like any other Gtk.Widget with the `new` keyword.
```js
const counterButton = new CounterButton({
    count: 0,

    // you can set AGS widget props on it
    className: '',
    connections: [],
})

counterButton.connect('notify::count', ({ count }) => {
    print(count);
})
```
