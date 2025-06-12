import { Astal, Gdk } from "ags/gtk3"
import { createState } from "ags"

type Popover2Props = Pick<
  JSX.IntrinsicElements["window"],
  "name" | "namespace" | "class" | "visible"
> & {
  onClose?(self: Astal.Window): void
  children?: JSX.Element
}

/**
 * Full screen window where the child is positioned to center.
 *
 * NOTE: Workaround for the label wrap issue by padding the window
 * with eventboxes and only anchoring to TOP | BOTTOM.
 */
export default function Popover2({
  children,
  onClose,
  ...props
}: Popover2Props) {
  let win: Astal.Window

  const [width, setWidth] = createState(1000)
  const hide = () => (win.visible = false)

  return (
    <window
      {...props}
      $={(self) => (win = self)}
      css="background-color: transparent"
      keymode={Astal.Keymode.EXCLUSIVE}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      $$visible={(self) => {
        // instead of anchoring to all sides we set the width explicitly
        // otherwise label wrapping won't work correctly without setting their width
        if (self.visible) {
          setWidth(self.get_current_monitor().workarea.width)
        } else {
          onClose?.(self)
        }
      }}
      // close when hitting Escape
      $key-press-event={(self, event: Gdk.Event) => {
        if (event.get_keyval()[1] === Gdk.KEY_Escape) {
          self.visible = false
        }
      }}
    >
      <box>
        <eventbox widthRequest={width((w) => w / 2)} expand $click={hide} />
        <box hexpand={false} vertical>
          <eventbox expand $click={hide} />
          {children}
          <eventbox expand $click={hide} />
        </box>
        <eventbox widthRequest={width((w) => w / 2)} expand $click={hide} />
      </box>
    </window>
  )
}
