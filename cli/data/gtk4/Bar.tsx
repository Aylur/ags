import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { Poll } from "ags/state"

const time = new Poll("", 1000, "date")

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return (
        <window
            visible
            name="bar"
            class="Bar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={TOP | LEFT | RIGHT}
            application={app}
        >
            <centerbox cssName="centerbox">
                <button
                    _type="start"
                    $clicked={() => execAsync("echo hello")}
                    hexpand
                    halign={Gtk.Align.CENTER}
                >
                    <label label="Welcome to AGS!" />
                </button>
                <box _type="center" />
                <menubutton
                    _type="end"
                    hexpand
                    halign={Gtk.Align.CENTER}
                >
                    <label label={time()} />
                    <popover>
                        <Gtk.Calendar />
                    </popover>
                </menubutton>
            </centerbox>
        </window>
    )
}
