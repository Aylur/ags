/* eslint-disable @typescript-eslint/no-namespace */
import Gtk from "gi://Gtk?version=4.0"
import Astal from "gi://Astal?version=4.0"
import { CCProps } from "../../gnim/src/jsx/index.js"
import { intrinsicElements } from "../../gnim/src/gtk4/jsx-runtime.js"

type Props<T extends Gtk.Widget, Props> = CCProps<T, Partial<Props>>

Object.assign(intrinsicElements, {
    box: Gtk.Box,
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
            box: Props<Gtk.Box, Gtk.Box.ConstructorProps>
            button: Props<Gtk.Button, Gtk.Button.ConstructorProps>
            centerbox: Props<Gtk.CenterBox, Gtk.CenterBox.ConstructorProps>
            // circularprogress: Props<Astal.CircularProgress, Astal.CircularProgress.ConstructorProps>
            drawingarea: Props<Gtk.DrawingArea, Gtk.DrawingArea.ConstructorProps>
            entry: Props<Gtk.Entry, Gtk.Entry.ConstructorProps>
            image: Props<Gtk.Image, Gtk.Image.ConstructorProps>
            label: Props<Gtk.Label, Gtk.Label.ConstructorProps>
            levelbar: Props<Gtk.LevelBar, Gtk.LevelBar.ConstructorProps>
            menubutton: Props<Gtk.MenuButton, Gtk.MenuButton.ConstructorProps>
            overlay: Props<Gtk.Overlay, Gtk.Overlay.ConstructorProps>
            popover: Props<Gtk.Popover, Gtk.Popover.ConstructorProps>
            revealer: Props<Gtk.Revealer, Gtk.Revealer.ConstructorProps>
            scrolledwindow: Props<Gtk.ScrolledWindow, Gtk.ScrolledWindow.ConstructorProps>
            slider: Props<Astal.Slider, Astal.Slider.ConstructorProps>
            stack: Props<Gtk.Stack, Gtk.Stack.ConstructorProps>
            switch: Props<Gtk.Switch, Gtk.Switch.ConstructorProps>
            togglebutton: Props<Gtk.ToggleButton, Gtk.ToggleButton.ConstructorProps>
            window: Props<Astal.Window, Astal.Window.ConstructorProps>
        }
    }
}

export * from "../../gnim/src/gtk4/jsx-runtime.js"
