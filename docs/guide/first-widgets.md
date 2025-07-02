# First Widgets

On this page you will learn about the JSX syntax. To learn about it more in
depth you can read the [Gnim docs](https://aylur.github.io/gnim/jsx.html).

> [!TIP]
>
> `gnim` is reexported from the `ags` module.

## Entry point of applications

Every application's entry point is an `app.start` invocation. `app` is a
singleton instance of
[Astal.Application](https://aylur.github.io/libastal/astal4/class.Application.html).

```ts [<i class="devicon-typescript-plain"></i> app.ts]
import app from "ags/gtk4/app"

app.start({
  main() {
    // you will instantiate Widgets here
    // and setup anything else if you need
  },
})
```

## Root of every shell component: Window

Desktop Shells are composed of widgets. A widget is a piece of UI that has its
own logic and style. A widget can be as small as a button or an entire bar. The
top level - also known as a root - widget is always a
[Window](https://aylur.github.io/libastal/astal4/class.Window.html).

```tsx [widget/Bar.tsx]
function Bar(monitor = 0) {
  return (
    <window class="Bar" monitor={monitor}>
      <box>Content of the widget</box>
    </window>
  )
}

app.start({
  main() {
    Bar(0)
    Bar(1) // instantiate for each monitor
  },
})
```

## Creating and nesting widgets

Widgets are JavaScript functions which return `GObject.Object` (usually
`Gtk.Widget`) instances by using JSX expressions.

:::code-group

```tsx [MyButton.tsx]
function MyButton() {
  return (
    <button onClicked={(self) => console.log(self, "clicked")}>
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
        Click The button
        <MyButton />
      </box>
    </window>
  )
}
```

Notice that widgets you defined start with a capital letter `<MyButton />`.
Lowercase tags are builtin [intrinsic](./intrinsics) widgets, while capital
letter is for custom widgets.

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

> [!TIP]
>
> [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) values are
> not rendered.

## Rendering lists

You can use
[`for` loops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for)
or
[array `map()` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

```tsx
function MyWidget() {
  const labels = ["label1", "label2", "label3"]

  return (
    <box>
      {labels.map((label) => (
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

  return <button onClicked={onClicked} />
}
```

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

> [!TIP]
>
> `JSX.Element` is an alias to `GObject.Object`

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

State is managed using signals. The most common signal you will use is
`createState` and `createBinding`. `createState` is a writable signal while
`createBinding` will be used to hook into GObject properties.

:::code-group

```tsx [State example]
import { createState } from "ags"

function Counter() {
  const [count, setCount] = createState(0)

  function increment() {
    setCount((v) => v + 1)
  }

  const label = count((num) => num.toString())

  return (
    <box>
      <label label={label} />
      <button onClicked={increment}>Click to increment</button>
    </box>
  )
}
```

```tsx [GObject example]
import GObject, { register, property } from "ags/gobject"
import { createBinding } from "ags"

@register()
class CountStore extends GObject.Object {
  @property(Number) counter = 0
}

function Counter() {
  const count = new CountStore()

  function increment() {
    count.counter += 1
  }

  const counter = createBinding(count, "counter")
  const label = counter((num) => num.toString())

  return (
    <box>
      <label label={label} />
      <button onClicked={increment}>Click to increment</button>
    </box>
  )
}
```

:::

Signals can be called as a function which lets you transform its value. In the
case of a `Gtk.Label` in this example, its label property expects a string, so
it needs to be turned to a string first.

## Dynamic rendering

When you want to render based on a value, you can use the `<With>` component.

```tsx
import { With, Accessor } from "ags"

let value: Accessor<{ member: string } | null>

return (
  <box>
    <With value={value}>
      {(value) => value && <label label={value.member} />}
    </With>
  </box>
)
```

> [!TIP]
>
> In a lot of cases it is better to always render the component and set its
> `visible` property instead

<!-- -->

> [!WARNING]
>
> When the value changes and the widget is re-rendered the previous one is
> removed from the parent component and the new one is _appended_. Order of
> widgets are _not_ kept so make sure to wrap `<With>` in a container to avoid
> it. This is due to Gtk not having a generic API on containers to sort widgets.

## Dynamic list rendering

The `<For>` component let's you render based on an array dynamically. Each time
the array changes it is compared with its previous state. Widgets for new items
are inserted while widgets associated with removed items are removed.

```tsx
import { For, Accessor } from "ags"

let list: Accessor<Array<any>>

return (
  <box>
    <For each={list}>
      {(item, index: Binding<number>) => (
        <label label={index.as((i) => `${i}. ${item}`)} />
      )}
    </For>
  </box>
)
```

> [!WARNING]
>
> Similarly to `<With>`, when the list changes and a new item is added it is
> simply **appended** to the parent. Order of widgets are not kept so make sure
> to wrap `<For>` in a container to avoid this.
