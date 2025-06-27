import Gtk from "gi://Gtk?version=3.0"
import Astal from "gi://Astal?version=3.0"
import { mkApp } from "../_app.js"

Gtk.init(null)

export default mkApp(Astal.Application)
