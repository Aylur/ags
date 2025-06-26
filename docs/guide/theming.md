# Theming

Since the widget toolkit is **GTK** theming is done with **CSS**.

- [CSS tutorial](https://www.w3schools.com/css/)
- Gtk4
  - [GTK4 CSS Overview wiki](https://docs.gtk.org/gtk4/css-overview.html)
  - [GTK4 CSS Properties Overview wiki](https://docs.gtk.org/gtk4/css-properties.html)
- Gtk3
  - [GTK3 CSS Overview wiki](https://docs.gtk.org/gtk3/css-overview.html)
  - [GTK3 CSS Properties Overview wiki](https://docs.gtk.org/gtk3/css-properties.html)

> [!WARNING] GTK is not the web
>
> While most features are implemented in GTK, you can't assume anything that
> works on the web will work with GTK. Refer to the GTK docs to see what is
> supported.

## Loading static stylesheets

You can import any `css` or `scss` file which will be inlined as a string which
you can pass to the css property.

:::code-group

```ts [app.ts]
import css from "./style.css"
import scss from "./style.scss"

const inlineCss = `
  window {
    background-color: transparent;
  }
`

app.start({
  css: css,
  css: scss,
  css: inlineCss,
})
```

:::

## Css Property on Widgets

You should always prefer to style using class names and stylesheets. But in
those rare cases when you need apply a style based on a JavaScript value you can
use the `css` property.

```tsx
<box css="padding 1em; border: 1px solid red;" />
```

> [!WARNING]
>
> The `css` property of a widget will not cascade to its children. You should
> generally avoid using `css` and instead use `class` and stylesheets.

## Apply Stylesheets at Runtime

You can apply additional styles at runtime.

```ts
app.apply_css("/path/to/file.css")
```

```ts
app.apply_css(`
  window {
    background-color: transparent;
  }
`)
```

```ts
app.reset_css() // reset if need
```

> [!WARNING]
>
> `apply_css()` will apply on top of other stylesheets applied before. You can
> reset stylesheets with `reset_css()`

## Inspector

If you are not sure about the widget hierarchy or any CSS selector, you can use
the [GTK inspector](https://wiki.gnome.org/Projects/GTK/Inspector)

:::code-group

```sh [ags]
ags inspect
```

```sh [astal]
astal --inspector
```

:::
