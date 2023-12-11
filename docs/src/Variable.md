Variable is just a simple `GObject` that holds a value.

> [!NOTE]
> The construction will depend on how you import it. The default import is a function while the `Vaiable` member in the module is the `class` itself.
```js
// default function
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
const myVar = Variable('initial-value');

// Variable class
import { Variable } from 'resource:///com/github/Aylur/ags/variable.js';
const myVar = new Variable('initial-value');
```

Polling and Listening to executables
```js
const myVar = Variable('initial-value', {
    // listen is what will be passed to Utils.subprocess, so either a string or string[]
    listen: App.configDir + '/script.sh',
    listen: ['bash', '-c', 'some-command'],

    // can also take a transform function
    listen: [App.configDir + '/script.sh', out => JSON.parse(out)],
    listen: [['bash', '-c', 'some-command'], out => JSON.parse(out)],

    // poll is a [interval: number, cmd: string[] | string, transform: (string) => any]
    // string and string[] is what gets passed to Utils.execAsync
    poll: [1000, 'some-command'],
    poll: [1000, 'some-command', out => 'transformed output: ' + out],
    poll: [1000, ['bash', '-c', 'some-command'], out => 'transformed output: ' + out],

    // or [number, function]
    poll: [1000, () => { return new Date(); }],
});
```

Updating its value
```js
myVar.value = 'new-value';
myVar.setValue('new-value');
```

Getting its value
```js
print(myVar.value);
print(myVar.getValue());
```

Temporarily stopping it
```js
variable.stopListen(); // this kills the subprocess
variable.stopPoll();
```

Starting it. It will start on construction, no need to explicitly call this.
```js
variable.startListen(); // launches the subprocess again 
variable.startPoll();
```

Getting if its active
```js
print(variable.isListening);
print(variable.isPolling);
```

Usage with widgets
```js
const label = Widget.Label({
    binds: [
        // [propName: string, variable: Variable]
        // this means that whenever myVar's value changes
        // Label.label will be updated
        ['label', myVar],

        // you can specify a transform function like this
        ['label', myVar, 'value', value => value.toString()],
    ],
    connections: [
        // can also be connected to
        [myVar, self => {
            self.label = myVar.value.toString();
        }],
    ],
});
```

Connecting to it directly
```js
myVar.connect('changed', ({ value }) => {
    console.log(value);
});
```

Dispose of it, if no longer needed. This will stop the interval and force exit the subprocess
```js
myVar.dispose();
```

#### Example RAM and CPU usage
```js
const divide = ([total, free]) => free / total;

const cpu = Variable(0, {
    poll: [2000, 'top -b -n 1', out => divide([100, out.split('\n')
        .find(line => line.includes('Cpu(s)'))
        .split(/\s+/)[1]
        .replace(',', '.')])],
});

const ram = Variable(0, {
    poll: [2000, 'free', out => divide(out.split('\n')
        .find(line => line.includes('Mem:'))
        .split(/\s+/)
        .splice(1, 2))],
});

const cpuProgress = Widget.CircularProgress({
    binds: [['value', cpu]],
});

const ramProgress = Widget.CircularProgress({
    binds: [['value', ram]],
});
```
