/* eslint-disable @typescript-eslint/no-namespace */
import Gtk from "gi://Gtk?version=3.0"
import Astal from "gi://Astal?version=3.0"
import { CCProps } from "../../gjsx/src/jsx/index.js"
import { intrinsicElements } from "../../gjsx/src/gtk3/jsx-runtime.js"

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
            box: CCProps<Astal.Box, Omit<Astal.Box.ConstructorProps, "children">>
            button: CCProps<Astal.Button, Astal.Button.ConstructorProps>
            centerbox: CCProps<Astal.CenterBox, Astal.CenterBox.ConstructorProps>
            circularprogress: CCProps<Astal.CircularProgress, Astal.CircularProgress.ConstructorProps>
            drawingarea: CCProps<Gtk.DrawingArea, Gtk.DrawingArea.ConstructorProps>
            entry: CCProps<Gtk.Entry, Gtk.Entry.ConstructorProps>
            eventbox: CCProps<Astal.EventBox, Astal.EventBox.ConstructorProps>
            icon: CCProps<Astal.Icon, Astal.Icon.ConstructorProps>
            label: CCProps<Astal.Label, Astal.Label.ConstructorProps>
            levelbar: CCProps<Astal.LevelBar, Astal.LevelBar.ConstructorProps>
            menubutton: CCProps<Gtk.MenuButton, Gtk.MenuButton.ConstructorProps>
            overlay: CCProps<Astal.Overlay, Astal.Overlay.ConstructorProps>
            popover: CCProps<Gtk.Popover, Gtk.Popover.ConstructorProps>
            revealer: CCProps<Gtk.Revealer, Gtk.Revealer.ConstructorProps>
            scrollable: CCProps<Astal.Scrollable, Astal.Scrollable.ConstructorProps>
            slider: CCProps<Astal.Slider, Astal.Slider.ConstructorProps>
            stack: CCProps<Astal.Stack, Astal.Stack.ConstructorProps>
            switch: CCProps<Gtk.Switch, Gtk.Switch.ConstructorProps>
            togglebutton: CCProps<Gtk.ToggleButton, Gtk.ToggleButton.ConstructorProps>
            window: CCProps<Astal.Window, Astal.Window.ConstructorProps>
        }
    }
}

export * from "../../gjsx/src/gtk3/jsx-runtime.js"
