Since the widget toolkit is **GTK3** the theeming is done with **CSS**.

> [!IMPORTANT]  
> GTK is **not the web**, while most features are also implemented in GTK, you can't assume anything that works on the web will work with GTK. Refer to the GTK docs to see what is available.

* [CSS tutorial](https://www.w3schools.com/css/)
* [GTK CSS Overview wiki](https://docs.gtk.org/gtk3/css-overview.html)
* [GTK CSS Properties Overview wiki ](https://docs.gtk.org/gtk3/css-properties.html)

Specify it at startup
```js
// config.js
export default {
    style: '/full/path/to/file.css'
}
```

Apply it at runtime

> [!WARNING]
> `App.applyCss` will apply over other stylesheets applied before. You can reset stylesheets with `App.resetCss`

```js
import App from 'resource:///com/github/Aylur/ags/app.js'

App.resetCss() // reset if need
App.applyCss('/full/path/to/file.css')
```

If you are not sure about the widget hierarchy or any CSS selector, you can use the [GTK inspector](https://wiki.gnome.org/Projects/GTK/Inspector)

```bash
# to bring up the inspector run
ags --inspector
```

> [!NOTE]
> If you are coming from [Eww](https://github.com/elkowar/eww) and you want to use SCSS

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
    windows: [ /* */ ],
}
```

> [!NOTE]
> To have your SCSS autoreload you can set it up using `Utils.monitorFile`

```js
import App from 'resource:///com/github/Aylur/ags/app.js'
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'

Utils.monitorFile(
    // directory that contains scss files
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
