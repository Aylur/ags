import { App, Astal, Gtk } from "astal/gtk3"
import { Variable } from "astal"

const time = Variable("").poll(1000, "date")

export default function Bar(monitor: number) {
    return <window
        className="Bar"
        monitor={monitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={Astal.WindowAnchor.TOP
            | Astal.WindowAnchor.LEFT
            | Astal.WindowAnchor.RIGHT}
        application={App}>
        <centerbox>
            <button
                onClicked="echo hello"
                halign={Gtk.Align.CENTER} >
                Welcome to AGS!
            </button>
            <box />
            <button
                onClick={() => print("hello")}
                halign={Gtk.Align.CENTER} >
                <label label={time()} />
            </button>
        </centerbox>
    </window>
}
