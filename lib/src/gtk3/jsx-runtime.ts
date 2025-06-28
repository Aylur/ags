/* eslint-disable @typescript-eslint/no-namespace */
import Gtk from "gi://Gtk?version=3.0"
import Astal from "gi://Astal?version=3.0"
import { CCProps } from "../../gnim/src/jsx/index.js"
import { intrinsicElements } from "../../gnim/src/gtk3/jsx-runtime.js"

type Props<T extends Gtk.Widget, Props> = CCProps<T, Partial<Props>>

Object.defineProperty(Astal.Box.prototype, "children", {
    get() {
        return this.get_children()
    },
    set(v) {
        this.set_children(v)
    },
})

Object.defineProperty(Astal.Overlay.prototype, "overlays", {
    get() {
        return this.get_overlays()
    },
    set(v) {
        this.set_overlays(v)
    },
})

Object.assign(intrinsicElements, {
    box: Astal.Box,
    button: Astal.Button,
    centerbox: Astal.CenterBox,
    circularprogress: Astal.CircularProgress,
    drawingarea: Gtk.DrawingArea,
    entry: Gtk.Entry,
    eventbox: Astal.EventBox,
    icon: Astal.Icon,
    label: Astal.Label,
    levelbar: Astal.LevelBar,
    menubutton: Gtk.MenuButton,
    overlay: Astal.Overlay,
    popover: Gtk.Popover,
    revealer: Gtk.Revealer,
    scrollable: Astal.Scrollable,
    slider: Astal.Slider,
    stack: Astal.Stack,
    switch: Gtk.Switch,
    togglebutton: Gtk.ToggleButton,
    window: Astal.Window,
})

declare global {
    namespace JSX {
        // prettier-ignore
        interface IntrinsicElements {
            box: Props<Astal.Box, Omit<Astal.Box.ConstructorProps, "children">>
            button: Props<Astal.Button, Astal.Button.ConstructorProps>
            centerbox: Props<Astal.CenterBox, Astal.CenterBox.ConstructorProps>
            circularprogress: Props<Astal.CircularProgress, Astal.CircularProgress.ConstructorProps>
            drawingarea: Props<Gtk.DrawingArea, Gtk.DrawingArea.ConstructorProps>
            entry: Props<Gtk.Entry, Gtk.Entry.ConstructorProps>
            eventbox: Props<Astal.EventBox, Astal.EventBox.ConstructorProps>
            icon: Props<Astal.Icon, Astal.Icon.ConstructorProps>
            label: Props<Astal.Label, Astal.Label.ConstructorProps>
            levelbar: Props<Astal.LevelBar, Astal.LevelBar.ConstructorProps>
            menubutton: Props<Gtk.MenuButton, Gtk.MenuButton.ConstructorProps>
            overlay: Props<Astal.Overlay, Astal.Overlay.ConstructorProps>
            popover: Props<Gtk.Popover, Gtk.Popover.ConstructorProps>
            revealer: Props<Gtk.Revealer, Gtk.Revealer.ConstructorProps>
            scrollable: Props<Astal.Scrollable, Astal.Scrollable.ConstructorProps>
            slider: Props<Astal.Slider, Astal.Slider.ConstructorProps>
            stack: Props<Astal.Stack, Astal.Stack.ConstructorProps>
            switch: Props<Gtk.Switch, Gtk.Switch.ConstructorProps>
            togglebutton: Props<Gtk.ToggleButton, Gtk.ToggleButton.ConstructorProps>
            window: Props<Astal.Window, Astal.Window.ConstructorProps>
        }
    }
}

export * from "../../gnim/src/gtk3/jsx-runtime.js"
