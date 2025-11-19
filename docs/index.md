---
layout: home
pageClass: home-page

hero:
  name: AGS
  text: A framework for crafting Wayland Desktop Shells
  image: https://aylur.github.io/astal/icon.svg
  actions:
    - theme: brand
      text: Get Started
      link: /guide/install
    - theme: alt
      text: Resources
      link: /guide/resources

features:
  - title: Initialize projects
    details:
      With <code>ags init</code> you can initialize a project, which generates a
      basic template
  - title: Generate TypeScript types
    details:
      With <code>ags types</code> you can generate types from GObject based
      libraries
  - title: Bundle projects
    details:
      With <code>ags bundle</code> you can bundle your project into a single
      executable script
  - title: Run projects
    details:
      With <code>ags run</code> you can run projects without bundling them first
---

## Features

<article class="feature feature-3-2">
  <div class="feature-text">
  <h3>Use a familiar language</h3>

  <span>
    AGS uses the world's most used langauge: <i>JavaScript/TypeScript</i>. The rendering
    library which let's you use an XML like syntax in JavaScript is inspired by web
    frameworks such as React and Solid.
  </span>
  </div>

  <div class="feature-code feature-row-1">

```tsx
function Bar() {
  const [counter, setCounter] = createState(0)
  const time = createPoll("", 1000, "date")

  return (
    <window visible anchor={TOP | LEFT | RIGHT}>
      <centerbox>
        <label $type="start" label={time} />
        <button $type="end" onClicked={() => setCounter((c) => c + 1)}>
          <label label={counter((c) => `clicked ${c} times`)} />
        </button>
      </centerbox>
    </window>
  )
}
```

  </div>
</article>

<article class="feature feature-2-3">
  <div class="feature-text">
  <h3>Batteries included</h3>

  <span>
    Most common operations and queries you want to do are available from <a href="https://aylur.github.io/astal/" target="_blank">Astal</a> libraries. With most of the backend code provided, all you have to worry about is building the UI.
  </span>

  </div>

  <div class="feature-code">

```tsx
function BatteryLabel() {
  const percentage = createBinding(Battery.get_default(), "percentage")
  return <label label={percentage((p) => `${Math.round(p * 100)}%`)} />
}

function MediaPlayers() {
  const players = createBinding(Mpris.get_default(), "players")
  return (
    <For each={players}>
      {(player) => (
        <button
          label={createBinding(player, "title")}
          onClicked={() => player.play_pause()}
        />
      )}
    </For>
  )
}
```

  </div>
</article>

<article class="feature feature-3-2">
  <div class="feature-text">
  <h3>Styled with css</h3>

  <span>
    GTK supports styling with CSS. AGS also provides support for <a href="https://sass-lang.com/" target="_blank">SASS</a>. Although it's only a subset of what you can do on the web, most things you'd want are supported, such as CSS variables, keyframes, transforms, and more.
  </span>

  <div class="feature-gtk-css">
    <a href="https://docs.gtk.org/gtk4/css-properties.html" target="_blank">List of supported CSS features</a>
  </div>

  </div>

  <div class="feature-code feature-row-1">

<!-- prettier-ignore -->
```css
button {
  animation: wiggle 2s linear infinite;
}
@keyframes wiggle {
  0% { transform: rotateZ(0); }
  7% { transform: rotateZ(0); }
  15% { transform: rotateZ(-15deg); }
  20% { transform: rotateZ(10deg); }
  25% { transform: rotateZ(-10deg); }
  30% { transform: rotateZ(6deg); }
  35% { transform: rotateZ(-4deg); }
  40% { transform: rotateZ(0); }
  100% { transform: rotateZ(0); }
}
```

  </div>
</article>

## Showcases

<div class="showcase">

![delta-shell](https://i.imgur.com/rnEX49B.png)

  <div class="showcase-title">

[Delta Shell](https://github.com/Sinomor/delta-shell) by Sinomor

  </div>

</div>

<div class="showcase">

![epik-shell](https://raw.githubusercontent.com/Aylur/astal/f5c1d29a37d6404999aee9210cdbf09ed6a278be/docs/public/showcase/ezerinz.webp)

  <div class="showcase-title">

[Epik Shell](https://github.com/ezerinz/epik-shell) by ezerinz

  </div>

</div>

<div class="showcase">

![colorshell](https://raw.githubusercontent.com/retrozinndev/colorshell/238fde6e287c79dbcbe5df9f478aa4b71c602e37/repo/shots/center-window-control-center.png)

  <div class="showcase-title">

[colorshell](https://github.com/retrozinndev/colorshell) by retrozinndev

  </div>
</div>

<div class="showcase">

![OkPanel](https://raw.githubusercontent.com/JohnOberhauser/OkPanelScreenshots/refs/heads/main/menu.png)

  <div class="showcase-title">

[OkPanel](https://github.com/JohnOberhauser/OkPanel) by John Oberhauser

  </div>
</div>

<div class="showcase">

![marble-shell](https://marble-shell.pages.dev/full.png)

  <div class="showcase-title">

[Marble Shell](https://github.com/Aylur/marble-shell) by Aylur

  </div>
</div>
