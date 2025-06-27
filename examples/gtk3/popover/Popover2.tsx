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
      onNotifyVisible={(self) => {
        // instead of anchoring to all sides we set the width explicitly
        // otherwise label wrapping won't work correctly without setting their width
        if (self.visible) {
          setWidth(self.get_current_monitor().workarea.width)
        } else {
          onClose?.(self)
        }
      }}
      // close when hitting Escape
      onKeyPressEvent={(self, e) => {
        const event = e as unknown as Gdk.Event
        if (event.get_keyval()[1] === Gdk.KEY_Escape) {
          self.visible = false
        }
      }}
    >
      <box>
        <eventbox widthRequest={width((w) => w / 2)} expand onClick={hide} />
        <box hexpand={false} vertical>
          <eventbox expand onClick={hide} />
          {children}
          <eventbox expand onClick={hide} />
        </box>
        <eventbox widthRequest={width((w) => w / 2)} expand onClick={hide} />
      </box>
    </window>
  )
}
