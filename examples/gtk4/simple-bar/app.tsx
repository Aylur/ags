import { createBinding, For, This } from "ags"
import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./Bar"

app.start({
  css: style,
  // It's usually best to go with the default Adwaita theme
  // and built off of it, instead of allowing the system theme
  // to potentially mess something up when it is changed.
  // Note: `* { all:unset }` in css is not recommended.
  gtkTheme: "Adwaita",
  main() {
    const monitors = createBinding(app, "monitors")

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} />
          </This>
        )}
      </For>
    )
  },
})
