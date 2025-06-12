import app from "ags/gtk4/app"
import style from "./style.scss"
import NotificationPopups from "./NotificationPopups"

app.start({
  css: style,
  gtkTheme: "adw-gtk3-dark",
  main() {
    NotificationPopups()
  },
})
