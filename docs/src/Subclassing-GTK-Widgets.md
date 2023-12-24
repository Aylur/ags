## Using Gtk.Widgets not builtin
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

You can subclass Gtk.Widget not builtin to behave like AGS widgets.
```js
const Calendar = Widget.subclass(Gtk.Calendar)

const myCalendar = Calendar({
    showDayNames: false,
    showHeading: true,

    // now you can set AGS props
    className: 'my-calendar',
    setup(self) {
        self.bind()
    }
});
```

> [!NOTE]
> Calendar is available on `Widget`

> [!NOTE]
> Open up an issue/PR if you want to see a widget to be available on `Widget` by default.
## Custom Subclassing
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

// then simply call it
const button = CounterButton({
    color: 'blue',
    className: 'my-widget',
});
```

This approach comes with the limitation that parameters passed to these functions are that, just parameters and not `GObject` properties. If you still want to subclass, you can do so by subclassing a Gtk.WIdget using the `AgsWidget` mixin class.
```js
import AgsWidget from 'resource:///com/github/Aylur/ags/widgets/widget.js';

class CounterButton extends AgsWidget(Gtk.Button, 'CounterButton') {
    static {
        AgsWidget.register(this, {
            properties: {
                'count': ['int', 'rw']
            }
        })
    }

    // if you define the ParamSpec with AgsWidget.register or GObject.registerClass
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
})

counterButton.connect('notify::count', ({ count }) => {
    print(count);
})
```