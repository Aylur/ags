import "../overrides.js"
import GObject, { register, signal, setter } from "gnim/gobject"
import GLib from "gi://GLib?version=2.0"
import Gtk from "gi://Gtk?version=3.0"
import Gdk from "gi://Gdk?version=3.0"
import Gio from "gi://Gio?version=2.0"
import { getter } from "gnim/gobject"
import { AppDBus } from "../app/dbus.js"
import { setConsoleLogDomain } from "console"
import { exit, programArgs } from "system"
import { createRoot } from "gnim"

Gtk.init(null)

type StartConfig = Partial<{
    instanceName: string
    css: string
    icons: string
    gtkTheme: string
    iconTheme: string
    cursorTheme: string
    main(...argv: string[]): void
    requestHandler(argv: string[], res: (response: any) => void): void
}>

interface AppSignals extends Gtk.Application.SignalSignatures {
    "request": App["request"]
    "window-toggled": App["windowToggled"]
}

@register()
class App extends Gtk.Application {
    declare $signals: AppSignals

    #instanceName = "ags"
    #main?: (...argv: string[]) => void
    #requestHandlers = 0
    #dbusService: AppDBus
    #cssProviders = new Array<Gtk.CssProvider>()

    get #settings(): Gtk.Settings {
        const settings = Gtk.Settings.get_default()
        if (!settings) throw Error("could not get settings")
        return settings
    }

    get #display(): Gdk.Display {
        const display = Gdk.Display.get_default()
        if (!display) throw Error("could not get display")
        return display
    }

    get #screen(): Gdk.Screen {
        const screen = Gdk.Screen.get_default()
        if (!screen) throw Error("could not get display")
        return screen
    }

    get instanceName() {
        return this.#instanceName
    }

    /**
     * Get all monitors from {@link Gdk.Display}.
     */
    get_monitors() {
        const mons = Array.from({ length: this.#display.get_n_monitors() }, (_, i) =>
            this.#display.get_monitor(i),
        )

        return mons.filter((mon) => mon !== null)
    }

    @signal(Gtk.Window)
    private windowToggled(window: Gtk.Window) {
        void window
    }

    /**
     * Get all monitors from {@link Gdk.Display}.
     */
    @getter(Array)
    get monitors(): Array<Gdk.Monitor> {
        return this.get_monitors()
    }

    /**
     * Windows that has been added to this app
     * using {@link Gtk.Application.prototype.add_window}.
     */
    @getter(Array)
    get windows(): Array<Gtk.Window> {
        return this.get_windows()
    }

    /**
     * Shortcut for {@link Gtk.Settings.prototype.gtkThemeName}
     */
    @setter(String)
    set gtkTheme(name: string) {
        this.#settings.gtkThemeName = name
    }

    /**
     * Shortcut for {@link Gtk.Settings.prototype.gtkThemeName}
     */
    @getter(String)
    get gtkTheme() {
        return this.#settings.gtkThemeName
    }

    /**
     * Shortcut for {@link Gtk.Settings.prototype.gtkIconThemeName}
     */
    @setter(String)
    set iconTheme(name: string) {
        this.#settings.gtkIconThemeName = name
    }

    /**
     * Shortcut for {@link Gtk.Settings.prototype.gtkIconThemeName}
     */
    @getter(String)
    get iconTheme() {
        return this.#settings.gtkIconThemeName
    }

    /**
     * Shortcut for {@link Gtk.Settings.prototype.gtkCursorThemeName}
     */
    @setter(String)
    set cursorTheme(name: string) {
        this.#settings.gtkCursorThemeName = name
    }

    /**
     * Shortcut for {@link Gtk.Settings.prototype.gtkCursorThemeName}
     */
    @getter(String)
    get cursorTheme() {
        return this.#settings.gtkCursorThemeName
    }

    /**
     * Get a window by its {@link Gtk.Widget.prototype.name} that has been added to this app
     * using {@link Gtk.Application.prototype.add_window}.
     */
    get_window(name: string) {
        return this.windows.find((w) => w.name === name)
    }

    /**
     * Toggle the visibility of a window by its {@link Gtk.Widget.prototype.name}
     * that has been added to this app using {@link Gtk.Application.prototype.add_window}.
     */
    toggle_window(name: string) {
        const win = this.get_window(name)
        if (!win) throw Error(`no window registered with name "${name}"`)
        win.visible = !win.visible
    }

    /**
     * Reset previously set css providers with {@link App.prototype.apply_css}.
     */
    reset_css() {
        for (const provider of this.#cssProviders) {
            Gtk.StyleContext.remove_provider_for_screen(this.#screen, provider)
        }
    }

    /**
     * Add a new {@link Gtk.CssProvider}.
     * @param style Css string or a path to a css file.
     */
    apply_css(style: string, reset = false) {
        const provider = new Gtk.CssProvider()

        provider.connect("parsing-error", (_, _section, error) => {
            console.error(`CSS Error: ${error.message}`)
        })

        if (reset) this.reset_css()

        if (GLib.file_test(style, GLib.FileTest.EXISTS)) {
            provider.load_from_path(style)
        } else if (style.startsWith("resource://")) {
            provider.load_from_resource(style.replace("resource://", ""))
        } else {
            provider.load_from_data(style)
        }

        Gtk.StyleContext.add_provider_for_screen(
            this.#screen,
            provider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER,
        )

        this.#cssProviders.push(provider)
    }

    /**
     * Shortcut for {@link Gtk.IconTheme.prototype.append_search_path}.
     */
    add_icons(path: string) {
        Gtk.IconTheme.get_for_screen(this.#screen).append_search_path(path)
    }

    /**
     * Quit and exit the application.
     */
    quit(code = 0) {
        this.#dbusService.stop()
        super.quit()
        exit(code)
    }

    constructor() {
        super({ flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE })

        this.#dbusService = new AppDBus({
            toggleWindow: this.toggle_window.bind(this),
            quit: this.quit.bind(this),
            request: (argv) => new Promise((resolve) => this.request(argv, resolve)),
            insector: () => {
                Gtk.Window.set_interactive_debugging(true)
            },
        })

        this.#display.connect("monitor-added", () => {
            this.notify("monitors")
        })

        this.#display.connect("monitor-removed", () => {
            this.notify("monitors")
        })

        this.connect("window-added", (_, window) => {
            const id1 = window.connect("notify::visible", () => this.windowToggled(window))
            const id2 = this.connect("window-removed", (_, removed) => {
                if (removed == window) {
                    window.disconnect(id1)
                    this.disconnect(id2)
                }
            })
        })

        this.#settings.connect("notify", (_, { name }) => {
            switch (name) {
                case "gtk-theme-name":
                    this.notify("gtk-theme")
                    break
                case "gtk-icon-theme-name":
                    this.notify("icon-theme")
                    break
                case "gtk-cursor-theme-name":
                    this.notify("cursor-theme")
                    break
                default:
                    break
            }
        })
    }

    @signal(Array, Function)
    private request(args: string[], response: (response: string) => void) {
        if (this.#requestHandlers === 0) {
            response(`instance "${this.instanceName}" has no request handler implemented`)
        }
        void args
    }

    vfunc_command_line(cmd: Gio.ApplicationCommandLine): number {
        if (cmd.isRemote) {
            this.request(cmd.get_arguments(), (str) => {
                cmd.print_literal(str + "\n")
                cmd.done()
            })
        } else {
            this.hold()
            this.#dbusService.serve({
                name: this.applicationId,
            })
            createRoot((dispose) => {
                this.connect("shutdown", dispose)
                this.#main?.(...programArgs)
            })
        }

        return 0
    }

    start(config: StartConfig) {
        const { main, requestHandler, instanceName, css, icons, ...cfg } = config

        this.#main = main
        Object.assign(this, cfg)

        if (requestHandler) {
            this.connect("request", (_, args, response) => requestHandler(args, response))
        }

        if (instanceName) this.#instanceName = instanceName
        if (css) this.apply_css(css, false)
        if (icons) app.add_icons(icons)

        this.applicationId = "io.Astal." + this.instanceName
        setConsoleLogDomain(this.instanceName)
        this.runAsync(programArgs)
    }

    connect<S extends keyof AppSignals>(
        signal: S,
        callback: GObject.SignalCallback<this, AppSignals[S]>,
    ): number {
        if (signal === "request") this.#requestHandlers += 1
        return super.connect(signal, callback)
    }
}

const app = new App()
export default app
