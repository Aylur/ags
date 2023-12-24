Since the widget toolkit is **GTK3** the theeming is done with **CSS**.

* [CSS tutorial](https://www.w3schools.com/css/)
* [GTK CSS Overview wiki](https://docs.gtk.org/gtk3/css-overview.html)
* [GTK CSS Properties Overview wiki ](https://docs.gtk.org/gtk3/css-properties.html)

> [!IMPORTANT]  
> GTK is **not the web**, while most features are also implemented in GTK, you can't assume anything that works on the web will work with GTK. Refer to the [GTK docs](https://docs.gtk.org/gtk3/css-overview.html) to see what is available.

So far every widget you made used your default GTK3 theme. To make them more custom, you can apply stylesheets to them, which are either imported `css` files or `inline css` applied with the `css` property.

Setting a css file to be set on startup
```js
// config.js
import App from 'resource:///com/github/Aylur/ags/app.js';

export default {
    // this style attribute takes a full path to a css file
    style: '/home/username/.config/ags/style.css',

    // you can get the current config directory through App
    style: App.configDir + '/style.css',
}
```

Using `css` prop on a widget
```js
Widget.Label({
    css: 'color: blue; padding: 1em;',
    label: 'hello'
})
```

You can apply stylesheets at runtime

> [!WARNING]
> `App.applyCss` will apply over other stylesheets applied before. You can reset stylesheets with `App.resetCss`

```js
App.resetCss() // reset if need
App.applyCss('/full/path/to/file.css')
```

If you are not sure about the widget hierarchy or any CSS selector, you can use the [GTK inspector](https://wiki.gnome.org/Projects/GTK/Inspector)

```bash
# to bring up the inspector run
ags --inspector
```

## Using pre-processors like SCSS

```js
// in config.js
import App from 'resource:///com/github/Aylur/ags/app.js'
import { exec } from 'resource:///com/github/Aylur/ags/utils.js'

// main scss file
const scss = `${App.configDir}/style.scss`

// target css file
const css = `${App.configDir}/style.css`

// make sure sassc is installed on your system
exec(`sassc ${scss} ${css}`)

export default {
    style: css,
    windows: [ /* windows */ ],
}
```

> [!NOTE]
> To have your SCSS autoreload you can set it up using `Utils.monitorFile`

```js
import App from 'resource:///com/github/Aylur/ags/app.js'
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'

Utils.monitorFile(
    // directory that contains the scss files
    `${App.configDir}/style`,

    // reload function
    function() {
        // main scss file
        const scss = `${App.configDir}/style.scss`

        // target css file
        const css = `${App.configDir}/style.css`

        // compile, reset, apply
        Utils.exec(`sassc ${scss} ${css}`)
        App.resetCss()
        App.applyCss(css)
    },

    // specify that its a directory
    'directory',
)
```
