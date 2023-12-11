```bash
$ ags --help

USAGE:
    ags [OPTIONS]

OPTIONS:
    -h, --help              Print this help and exit
    -v, --version           Print version and exit
    -q, --quit              Kill AGS
    -c, --config            Path to the config file.
    -b, --bus-name          Bus name of the process
    -i, --inspector         Open up the Gtk debug tool
    -t, --toggle-window     Show or hide a window
    -r, --run-js            Execute string as an async function
    -f, --run-file          Execute file as an async function
    --clear-cache           Remove $HOME/.cache/ags

```

## Bus Name
It is possible to run multiple instances with `--bus-name`. It defaults to `"ags"`.
When an instance is running, executing `ags` is actually a client process that will try to connect to the instance with the specified bus name.

```bash
ags # starts an instance with bus name "ags" 
ags -i # opens up the inspector on the ags instance with bus name "ags"

ags --bus-name test # starts an instance with bus name "test" 
ags -b test -i # opens the inspector on instance with bus name "test" 

ags --quit
ags -b test --quit
```

> [!NOTE]
> The dbus name is `com.github.Aylur.ags.<bus-name>`, so the default one is `com.github.Aylur.ags.ags`

## Config file
`--config` defaults to `$HOME/.config/ags/config.js`
```bash
# example
ags --config $HOME/.config/some-dir/main.js
```

## Toggle Window
`--toggle-window` is just there for the sake of it, if you want to have more control use `--run-js`
```bash
# example
ags --toggle-window "bar"
```
## Running arbitrary JavaScript code on runtime
With `--run-js` it is possible to execute code when `ags` is already running. It is useful for: calling Service methods, updating Variable values, debugging or anything else.
`--run-js` expects a string which will be the body of an *async function* executed relative to `app.ts`. This is important because of how you can import modules inside this function.

If there is no `;` character in the string, `return` keyword will be inserted automatically
```bash
ags -r "'hello'" # prints hello
ags -r "'hello';" # prints undefined
ags -r "return 'hello';" # prints hello
```

`print` will print on the client side, `console.log` and other console methods will log on the main process's stdout
```bash
ags -r "print('hello')" # prints "hello undefined"
ags -r "console.log('hello')" # prints "undefined"
```

`--run-file` reads the content of a file and passes it to `--run-js`
```bash
# these two are equivalent 
ags --run-file /path/to/file.js
ags --run-js "$(cat /path/to/file.js)"
```

It is useful for shebangs
```js
#!/usr/bin/env -S ags --run-file
return 'hello from a file';
```

> [!IMPORTANT]
> Since `--run-js` is the body of a function, you can't use top level imports

This will throw an error
```js
#!/usr/bin/env -S ags --run-file
import App from 'resource:///com/Aylur/github/ags/app.js';
```

You can use `import` as a method however 
```js
#!/usr/bin/env -S ags --run-file
const App = (await import(
    'resource:///com/Aylur/github/ags/app.js'
)).default;
```

> [!NOTE]
> The function gets executed relative to `app.ts`, meaning `resource:///com/Aylur/github/ags` can be substituted as `.`
> This also means importing a module from your config needs a full path.

```js
#!/usr/bin/env -S ags --run-file
const App = (await import('./app.js')).default;

const File = await import(`file:///path/to/file.js`);
```

## Examples
Let's say you have a `Variable` in `$HOME/.config/ags/vars.js` that you want set from cli.
```js
// vars.js
export const myVar = Variable(0);
```

You can import this module and access this variable
```bash
ags -r "(await import('file://$HOME/.config/ags/vars.js')).myVar++"
```

Your can make `myVar` global, to avoid writing out the import statement
```js
// vars.js
export const myVar = Variable(0);
globalThis.myVar = myVar;
```
```bash
ags -r "myVar++"
```