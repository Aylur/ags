import { Astal, Gdk, Gtk } from "ags/gtk3"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

type PopoverProps = Pick<
  JSX.IntrinsicElements["window"],
  | "class"
  | "name"
  | "namespace"
  | "visible"
  | "marginBottom"
  | "marginTop"
  | "marginLeft"
  | "marginRight"
  | "halign"
  | "valign"
> & {
  onClose?(self: Astal.Window): void
  children: JSX.Element
}

/**
 * Full screen window widget where you can space the child widget
 * using margins and alignment properties.
 *
 * NOTE: Child widgets will assume they can span across the full window width
 * this means that setting `wrap` or `ellipsize` on labels for example will not work
 * without explicitly setting its `max_width_chars` property.
 * For a workaround see Popover2.tsx
 */
export default function Popover({
  children,
  marginBottom,
  marginTop,
  marginLeft,
  marginRight,
  halign = Gtk.Align.CENTER,
  valign = Gtk.Align.CENTER,
  onClose,
  ...props
}: PopoverProps) {
  return (
    <window
      {...props}
      css="background-color: transparent"
      keymode={Astal.Keymode.EXCLUSIVE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.IGNORE}
      onNotifyVisible={(self) => {
        if (!self.visible) onClose?.(self)
      }}
      // close when click occurs otside of child
      onButtonPressEvent={(self, e) => {
        const event = e as unknown as Gdk.Event
        const [, _x, _y] = event.get_coords()
        const { x, y, width, height } = self.get_child()!.get_allocation()

        const xOut = _x < x || _x > x + width
        const yOut = _y < y || _y > y + height

        // clicked outside
        if (xOut || yOut) {
          self.visible = false
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
      <box
        // make sure click event does not bubble up
        onButtonPressEvent={() => true}
        // child can be positioned with `halign`, `valign` and margins
        expand
        halign={halign}
        valign={valign}
        marginBottom={marginBottom}
        marginTop={marginTop}
        marginStart={marginLeft}
        marginEnd={marginRight}
      >
        {children}
      </box>
    </window>
  )
}
