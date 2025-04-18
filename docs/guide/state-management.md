# State management

## State

`State` is an object that holds a single value.
It's main purpose is to substitute class properties and
hold state in Function Components.

```ts
import { type Binding, State, bind } from "ags/state"

const state = new State<string>("0")

const binding: Binding<number> = bind(state).as((value) => parseInt(value))

// shorthand for the above
const binding: Binding<number> = state((value) => parseInt(value))

// value getters
state.get()
state.value

// setters
state.set("new value")
state.value = "new value"
```

> [!WARNING]
> New values are checked by reference and are not deeply reactive.
> This means mutating the value will not notify subscribers.
>
> ```ts
> const state = new State({ a: 0, b: "", c: false })
> const value = state.get()
>
> value.a++ // won't cause an update [!code error:2]
> state.value = value
> state.value = { ...value } // new object needs to be created
> ```

## Subscribing

You can run any side effect by subscribing to a Binding or State.

```ts
let observable: State<any> | Binding<any>

const unsubscribe = observable.subscribe((value) => {
    console.log(value)
})

unsubscribe()
```

Optionally, it is possible to pass in another object to limit
the lifetime of the subscription.

```ts
observable.subscribe(gobject, (value) => {
    console.log(value)
})
```

## Derived state

It is possible to derive `Bindings` and capture their value into a `State`.

```ts
import { State, derive, bind } from "ags/state"

const obj = Gtk.Label.new("hello")
const state1 = new State(0)
const state2 = new State({ member: "" })

const derived: State<[string, number, { member: string }]> = derive([
    bind(obj, "label"),
    bind(state1),
    bind(state2),
])
```

Optionally pass in a transform function:

```ts
const derived: State<string> = derive(
    [bind(obj, "label"), bind(state1), bind(state2)],
    (label, number, { member }) => `${label} ${number} ${member}`,
)
```

## Observing signals

It is possible to observe a list of signals and capture their values in State.

```ts
import { State, observe } from "ags/state"

const state: State<string> = observe(
    "initial value",
    [obj1, "some-signal", (arg: string) => `captured ${arg}`],
    [obj2, "some-signal", (arg: number) => `captured ${arg}`],
)
```

## Poll

It is possible to poll an executable or a function and capture its output
into a `State`.

```ts
import { Poll } from "ags/state"

const poll = new Poll(
    "initial valule",
    1000,
    "bash -c 'echo hello'",
    (stdout) => {
        // transform output
        return stdout
    },
)

const pollFn = new Poll("initial value", 1000, async () => {
    return "some value"
})
```

## Watch

It is possible to start an executable which runs indefinitely and capture
its output into a `State`.

```ts
import { Watch } from "ags/watch"

const watch = new Watch(
    "initial valule",
    1000,
    "long-running-process",
    (stdout) => {
        // new line is printed to stdout
        return stdout
    },
    (stderr) => {
        print("error", stderr)
    },
)
```

## Limiting state lifetime to widgets

:::warning
Don't forget to limit the lifetime of derived states to widgets
when creating them as part of a component

```tsx
function MyWidget() {
    const derived = derive(/**/)
    const observed = observe(/**/)
    const poll = new Poll(/**/)
    const watch = new Watch(/**/)

    function cleanup() {
        derived.destroy()
        observed.destroy()
        poll.destroy()
        watch.destroy()
    }

    return <box $destroy={cleanup} />
}
```

:::
