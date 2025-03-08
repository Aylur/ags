/* eslint-disable @typescript-eslint/no-namespace */
import Gtk from "gi://Gtk?version=4.0"
import Astal from "gi://Astal?version=4.0"
import { CCProps } from "../../gjsx/src/jsx/index.js"
import { intrinsicElements } from "../../gjsx/src/gtk4/jsx-runtime.js"

Object.assign(intrinsicElements, {
    box: Astal.Box,
    button: Gtk.Button,
    centerbox: Gtk.CenterBox,
    // circularprogress: Astal.CircularProgress,
    drawingarea: Gtk.DrawingArea,
    entry: Gtk.Entry,
    image: Gtk.Image,
    label: Gtk.Label,
    levelbar: Gtk.LevelBar,
    menubutton: Gtk.MenuButton,
    overlay: Gtk.Overlay,
    popover: Gtk.Popover,
    revealer: Gtk.Revealer,
    scrolledwindow: Gtk.ScrolledWindow,
    slider: Astal.Slider,
    stack: Gtk.Stack,
    switch: Gtk.Switch,
    togglebutton: Gtk.ToggleButton,
    window: Astal.Window,
})

declare global {
    namespace JSX {
        interface IntrinsicElements {
            box: CCProps<Astal.Box, Omit<Astal.Box.ConstructorProps, "children">>
            button: CCProps<Gtk.Button, Gtk.Button.ConstructorProps>
            centerbox: CCProps<Gtk.CenterBox, Gtk.CenterBox.ConstructorProps>
            // circularprogress: CCProps<Astal.CircularProgress, Astal.CircularProgress.ConstructorProps>
            drawingarea: CCProps<Gtk.DrawingArea, Gtk.DrawingArea.ConstructorProps>
            entry: CCProps<Gtk.Entry, Gtk.Entry.ConstructorProps>
            image: CCProps<Gtk.Image, Gtk.Image.ConstructorProps>
            label: CCProps<Gtk.Label, Gtk.Label.ConstructorProps>
            levelbar: CCProps<Gtk.LevelBar, Gtk.LevelBar.ConstructorProps>
            menubutton: CCProps<Gtk.MenuButton, Gtk.MenuButton.ConstructorProps>
            overlay: CCProps<Gtk.Overlay, Gtk.Overlay.ConstructorProps>
            popover: CCProps<Gtk.Popover, Gtk.Popover.ConstructorProps>
            revealer: CCProps<Gtk.Revealer, Gtk.Revealer.ConstructorProps>
            scrolledwindow: CCProps<Gtk.ScrolledWindow, Gtk.ScrolledWindow.ConstructorProps>
            slider: CCProps<Astal.Slider, Astal.Slider.ConstructorProps>
            stack: CCProps<Gtk.Stack, Gtk.Stack.ConstructorProps>
            switch: CCProps<Gtk.Switch, Gtk.Switch.ConstructorProps>
            togglebutton: CCProps<Gtk.ToggleButton, Gtk.ToggleButton.ConstructorProps>
            window: CCProps<Astal.Window, Astal.Window.ConstructorProps>
        }
    }
}

export * from "../../gjsx/src/gtk4/jsx-runtime.js"
