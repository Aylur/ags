import app from "ags/gtk3/app"
import { Astal, Gtk, Gdk } from "ags/gtk3"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const time = createPoll("", 1000, "date")
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
          $type="start"
          onClicked={() => execAsync("echo hello").then(console.log)}
          halign={Gtk.Align.CENTER}
        >
          <label label="Welcome to AGS!" />
        </button>
        <box $type="center" />
        <button
          $type="end"
          onClicked={() => print("hello")}
          halign={Gtk.Align.CENTER}
        >
          <label label={time} />
        </button>
      </centerbox>
    </window>
  )
}
