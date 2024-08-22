import { App, Variable, Astal, Gtk, Widget } from "astal"

/** @type {Variable<string>} */
const time = Variable("").poll(1000, "date")

/** @param {number} monitor */
export default function Bar(monitor = 0) {
    return Widget.Window(
        {
            className: "Bar",
            monitor,
            application: App,
            exclusivity: Astal.Exclusivity.EXCLUSIVE,
            anchor: Astal.WindowAnchor.TOP
                | Astal.WindowAnchor.LEFT
                | Astal.WindowAnchor.RIGHT,
        },
        Widget.CenterBox({},
            Widget.Button(
                {
                    onClicked: "echo hello",
                    halign: Gtk.Align.CENTER,
                },
                Widget.Label({
                    label: "hello",
                }),
            ),
            Widget.Box(),
            Widget.Button(
                {
                    onClicked: () => print("hello"),
                    halign: Gtk.Align.CENTER,
                },
                Widget.Label({
                    label: time(),
                }),
            ),
        ),
    )
}
