import { Media } from "./Media.js"

const win = Widget.Window({
    name: "mpris",
    anchor: ["top", "right"],
    child: Media(),
})

App.config({
    style: "./style.css",
    windows: [win],
})
