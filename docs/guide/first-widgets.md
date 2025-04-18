# First Widgets

On this page you will learn about the JSX syntax.
To learn about it more in depth
you can read the [Gjsx docs](https://aylur.github.io/gjsx/jsx.html).

## Entry point of applications

Every application's entry point is an `app.start` invocation. `app` is a
singleton instance of
[Astal.Application](https://aylur.github.io/libastal/astal4/class.Application.html).

:::code-group

```ts [app.ts]
import app from "ags/gtk4/app"

app.start({
    main() {
        // you will instantiate Widgets here
        // and setup anything else if you need
    },
})
```

:::

## Root of every shell component: Window

Desktop Shells are composed of widgets. A widget is a piece of UI that has its
own logic and style. A widget can be as small as a button or an entire bar. The
top level - also known as a root - widget is always a
[Window](https://aylur.github.io/libastal/astal4/class.Window.html) instance.

::: code-group

```tsx [widget/Bar.tsx]
function Bar(monitor = 0) {
    return (
        <window class="Bar" monitor={monitor}>
            <box>Content of the widget</box>
        </window>
    )
}
```

:::

::: code-group

```ts [app.ts]
import Bar from "./widget/Bar"

App.start({
    main() {
        Bar(0)
        Bar(1) // instantiate for each monitor
    },
})
```

:::

## Creating and nesting widgets

Widgets are JavaScript functions which return `Gtk.Widget` instances by using
JSX expressions.

:::code-group

```tsx [MyButton.tsx]
function MyButton() {
    return (
        <button $clicked={(self) => console.log(self, "clicked")}>
            <label label="Click me!" />
        </button>
    )
}
```

:::

Now that you have declared `MyButton`, you can nest it into another component.

```tsx
function MyBar() {
    return (
        <window>
            <box>
                Click The button:
                <MyButton />
            </box>
        </window>
    )
}
```

Notice that widgets you defined start with a capital letter `<MyButton />`.
Lowercase tags are builtin widgets, while capital letter is for custom widgets.

For a list of builtin widgets refer to the source code:

- [gtk3](https://github.com/Aylur/ags/blob/v3/lib/src/gtk3/jsx-runtime.ts)
- [gtk4](https://github.com/Aylur/ags/blob/v3/lib/src/gtk4/jsx-runtime.ts)

## Displaying Data

JSX lets you put markup into JavaScript. Curly braces let you “escape back” into
JavaScript so that you can embed some variable from your code and display it.

```tsx
function MyWidget() {
    const label = "hello"

    return <button>{label}</button>
}
```

You can also pass JavaScript to markup attributes

```tsx
function MyWidget() {
    const label = "hello"

    return <button label={label} />
}
```

## Conditional Rendering

You can use the same techniques as you use when writing regular JavaScript code.
For example, you can use an if statement to conditionally include JSX:

```tsx
function MyWidget() {
    let content

    if (condition) {
        content = <True />
    } else {
        content = <False />
    }

    return <box>{content}</box>
}
```

You can also inline a
[conditional `?`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator)
(ternary) expression.

```tsx
function MyWidget() {
    return <box>{condition ? <True /> : <False />}</box>
}
```

When you don’t need the `else` branch, you can also use a shorter
[logical && syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND#short-circuit_evaluation):

```tsx
function MyWidget() {
    return <box>{condition && <True />}</box>
}
```

:::tip
[falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) values are not rendered.
:::

## Rendering lists

You can use
[`for` loops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for)
or
[array `map()` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

```tsx
function MyWidget() {
    const labels = [
        "label1"
        "label2"
        "label3"
    ]

    return (
        <box>
            {labels.map(label => (
                <label label={label} />
            ))}
        </box>
    )
}
```

## Widget signal handlers

You can respond to events by declaring event handler functions inside your
widget:

```tsx
import Gtk from "gi://Gtk"

function MyButton() {
    function onClicked(self: Gtk.Button) {
        console.log(self, "was clicked")
    }

    return <button $clicked={onClicked} />
}
```

:::info
Attributes prefixed with `$` will connect to a `signal` of the widget.
Their types unfortunately can not be generated.
Refer to the Gtk docs on what signals are available.
:::

:::tip
Attributes prefixed with `$$` will connect to a `notify::` signal
of the widget.

```tsx
<switch $$active={(self) => print("switched to", self.active)} />
```

:::

## How properties are passed

Using JSX, a custom widget will always have a single object as its parameter.

```ts
type Props = {
    myprop: string
    children?: JSX.Element | Array<JSX.Element>
}

function MyWidget({ myprop, children }: Props) {
    //
}
```

The `children` property is a special one which is used to pass the children
given in the JSX expression.

```tsx
// `children` prop of MyWidget is the box
return (
    <MyWidget myprop="hello">
        <box />
    </MyWidget>
)
```

```tsx
// `children` prop of MyWidget is [box, box]
return (
    <MyWidget myprop="hello">
        <box />
        <box />
    </MyWidget>
)
```

## State management

The state of widgets are handled with Bindings. A [Binding](./binding) lets you
connect the state of an
[object](./binding#subscribable-and-connectable-interface) to a widget so it
re-renders when that state changes.

Use the `bind` function to create a `Binding` object from a `State` or a
regular `GObject` and one of its properties.

Here is an example of a Counter widget that uses a `State` as its state:

:::code-group

```tsx [State example]
import { State, bind } from "ags/state"

function CounterWith() {
    const count = new State(0)

    function increment() {
        count.value += 1
    }

    const label = bind(count).as((num) => num.toString())

    return (
        <box>
            <label label={label} />
            <button $clicked={increment}>Click to increment</button>
        </box>
    )
}
```

```tsx [GObject example]
import GObject, { register, property } from "ags/state"
import { bind } from "ags/state"

@register()
class CountStore extends GObject.Object {
    @property(Number) declare counter: number
}

function CounterWith() {
    const count = new CountStore()

    function increment() {
        count.counter += 1
    }

    const label = bind(count, "counter").as((num) => num.toString())

    return (
        <box>
            <label label={label} />
            <button $clicked={increment}>Click to increment</button>
        </box>
    )
}
```

:::

Bindings have an `.as()` method which lets you transform the assigned
value. In the case of a `Gtk.Label` in this example, its label property expects
a string, so it needs to be turned to a string first.

:::tip
`State` has a shorthand for `bind(state).as(transform)`

```tsx
const s = new State(0)
const transform = (v: number) => v.toString()

return (
    <box>
        {/* these two are equivalent */}
        <label label={bind(v).as(transform)} />
        <label label={v(transform)} />
    </box>
)
```

:::

Here is an example of a battery percent label that binds the `percentage`
property of the Battery object from the
[Battery Library](/guide/libraries/battery):

```tsx
import AstalBattery from "gi://AstalBattery"
import { bind } from "astal"

function BatteryPercentage() {
    const bat = AstalBattery.get_default()

    return <label label={bind(bat, "percentage").as((p) => p * 100 + " %")} />
}
```

## Dynamic rendering

When you want to render based on a value, you can use the `<With>` component.

```tsx
import { With } from "ags/gtk4"
import { State } from "ags/state"

const value = new State<{ member: string } | null>({
    member: "hello",
})

return (
    <box>
        <With value={value()} cleanup={(label) => label.run_dispose()}>
            {(value) => value && <label label={value.member} />}
        </With>
    </box>
)
```

> [!TIP]
> In a lot of cases it is better to always render the component and set its
> `visible` property instead

<!-- -->

> [!WARNING]
> When the value changes and the widget is re-rendered the previous one is removed
> from the parent component and the new one is **appended**. Order of widgets are
> not kept so make sure to wrap `<With>` in a container to avoid this.

## Dynamic list rendering

The `<For>` component let's you render based on an array dynamically.
Each time the array changes it is compared with its previous state.
Widgets for new items are inserted while widgets associated with removed items
are removed.

```tsx
import { For } from "ags/gtk4"

let list: Binding<Array<object>>

return (
    <box>
        <For each={list} cleanup={(label) => label.run_dispose()}>
            {(item, index: Binding<number>) => (
                <label label={index.as((i) => `${i}. ${item}`)} />
            )}
        </For>
    </box>
)
```

> [!WARNING]
> Similarly to `<With>`, when the list changes and a new item
> is added it is simply **appended** to the parent. Order of widgets
> are not kept so make sure to wrap `<For>` in a container to avoid this.
