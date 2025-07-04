# Utilities

AGS comes with some builtin utilities for common operations.

## File functions

### Reading files

```ts
import { readFile, readFileAsync } from "ags/file"

function readFile(path: string): string
function readFileAsync(path: string): Promise<string>
```

### Writing files

```ts
import { writeFile, writeFileAsync } from "ags/file"

function writeFile(path: string, content: string): void
function writeFileAsync(path: string, content: string): Promise<void>
```

### Monitoring files

If `path` is a directory it will be recursively monitored.

```ts
import { monitorFile } from "ags/file"

function monitorFile(
  path: string,
  callback: (file: string, event: Gio.FileMonitorEvent) => void,
): Gio.FileMonitor
```

## Timeouts and Intervals

```ts
import { interval, timeout, idle, createPoll } from "astal/time"
```

You can use javascript native `setTimeout` or `setInterval` they return a
[GLib.Source](https://docs.gtk.org/glib/struct.Source.html) instance.
Alternatively you can use these functions provided by Astal, which return an
[AstalIO.Time](https://aylur.github.io/libastal/io/class.Time.html) instance.

`AstalIO.Time` has a `now` signal and a `cancelled` signal.

### Interval

Will immediately execute the function and every `interval` millisecond.

```ts
function interval(interval: number, callback?: () => void): AstalIO.Time
```

### Timeout

Will execute the `callback` after `timeout` millisecond.

```ts
function timeout(timeout: number, callback?: () => void): AstalIO.Time
```

### Idle

Executes `callback` whenever there are no higher priority events pending.

```ts
function idle(callback?: () => void): AstalIO.Time
```

Example:

```ts
const timer = interval(1000, () => {
  console.log("optional callback")
})

timer.connect("now", () => {
  console.log("tick")
})

timer.connect("cancelled", () => {
  console.log("cancelled")
})

timer.cancel()
```

### createPoll

`createPoll` creates a signal that only polls when there is at least one
subscriber.

```ts
function createPoll(
  init: string,
  interval: number,
  exec: string | string[],
): Accessor<string>

function createPoll<T>(
  init: T,
  interval: number,
  exec: string | string[],
  transform: (stdout: string, prev: T) => T,
): Accessor<T>

function createPoll<T>(
  init: T,
  interval: number,
  fn: (prev: T) => T | Promise<T>,
): Accessor<T>
```

Example:

```tsx
function Counter() {
  const counter = createPoll(0, 1000, (prev) => prev + 1)

  return <label label={counter((c) => c.toString())} />
}
```

## Process functions

Import from `ags/process`

```ts
import { subprocess, exec, execAsync, createSubprocess } from "ags/process"
```

### Subprocess

You can start a subprocess and run callback functions whenever it outputs to
stdout or stderr.
[AstalIO.Process](https://aylur.github.io/libastal/io/class.Process.html) has a
`stdout` and `stderr` signal.

```ts
function subprocess(args: {
  cmd: string | string[]
  out?: (stdout: string) => void
  err?: (stderr: string) => void
}): AstalIO.Process

function subprocess(
  cmd: string | string[],
  onOut?: (stdout: string) => void,
  onErr?: (stderr: string) => void,
): AstalIO.Process
```

Example:

```ts
const proc = subprocess(
  "some-command",
  (out) => console.log(out), // optional
  (err) => console.error(err), // optional
)

// or with signals
const proc = subprocess("some-command")
proc.connect("stdout", (_, out) => console.log(out))
proc.connect("stderr", (_, err) => console.error(err))
```

### Executing external commands and scripts

```ts
function exec(cmd: string | string[]): string
function execAsync(cmd: string | string[]): Promise<string>
```

Example:

```ts
try {
  const out = exec("/path/to/script")
  console.log(out)
} catch (err) {
  console.error(err)
}

execAsync(["bash", "-c", "/path/to/script.sh"])
  .then((out) => console.log(out))
  .catch((err) => console.error(err))
```

> [!WARNING]
>
> `subprocess`, `exec`, and `execAsync` executes the passed executable as is.
> They are **not** executed in a shell environment, they do **not** expand ENV
> variables like `$HOME`, and they do **not** handle logical operators like `&&`
> and `||`.
>
> If you want bash, run them with bash.
>
> ```ts
> exec(["bash", "-c", "command $VAR && command"])
> exec("bash -c 'command $VAR' && command")
> ```

### createSubprocess

`createSubprocess` creates a signal that starts a subprocess when the first
subscriber appears and kills the subprocess when number of subscribers drop to
zero.

```ts
export function createSubprocess(
  init: string,
  exec: string | string[],
): Accessor<string>

export function createSubprocess<T>(
  init: T,
  exec: string | string[],
  transform: (stdout: string, prev: T) => T,
): Accessor<T>
```

Example:

```tsx
function Log() {
  const log = createSubprocess("", "journalctl -f")

  return <label label={log} />
}
```

## Http requests

```ts
import { fetch, URL } from "ags/fetch"

const url = new URL("https://some-site.com/api")
url.searchParams.set("hello", "world")

const res = await fetch(url, {
  method: "POST",
  body: JSON.stringify({ hello: "world" }),
  headers: {
    "Content-Type": "application/json",
  },
})

const json = await res.json()
```
