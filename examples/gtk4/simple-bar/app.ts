import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./Bar"

app.start({
  css: style,
  gtkTheme: "Adwaita",
  main() {
    app.get_monitors().map(Bar)
  },
})
