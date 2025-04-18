import app from "ags/gtk3/app"
import { Astal, Gtk, Gdk } from "ags/gtk3"
import { execAsync } from "ags/process"
import { Poll } from "ags/state"

const time = new Poll("", 1000, "date")

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return (
        <window
            class="Bar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={TOP | LEFT | RIGHT}
            application={app}
        >
            <centerbox>
                <button
                    _type="start"
                    $clicked={() => execAsync("echo hello")}
                    halign={Gtk.Align.CENTER}
                >
                    <label label="Welcome to AGS!" />
                </button>
                <box _type="center" />
                <button
                    _type="end"
                    $clicked={() => print("hello")}
                    halign={Gtk.Align.CENTER}
                >
                    <label label={time()} />
                </button>
            </centerbox>
        </window>
    )
}
