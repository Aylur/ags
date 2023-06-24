import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';

/**
 * Windows are the top-level widgets in our application.
 * They hold all of the other widgets, and when a window is closed
 * all of them are destroyed (unless `hide-on-close` is set).
 *
 * For most cases, you will want to use an AdwApplicationWindow
 * as the parent class for your windows. GtkApplicationWindow and
 * AdwApplicationWindow both integrate with your Application class,
 * getting information about the application like the app ID and tying
 * the window and application's lifecycles together. In addition,
 * both of these classes allow you to directly add actions to them.
 * These actions will be prefixed with `win`.
 *
 * For more information on windows, see:
 *  - https://docs.gtk.org/gtk4/class.Window.html
 *  - https://docs.gtk.org/gtk4/class.ApplicationWindow.html
 *  - https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/class.ApplicationWindow.html
 */
export class Window extends Adw.ApplicationWindow {
    private _toastOverlay!: Adw.ToastOverlay;

    static {
        /**
         * Here we use a template. We define the resource path to the .ui file
         * and the `id` of the objects we want to be able to access programmatically.
         *
         * For a detailed guide on how to use templates in GTK4,
         * see https://rmnvgr.gitlab.io/gtk4-gjs-book/application/ui-templates-composite-widgets/
         *
         * **IMPORTANT**: Above where you see `private _toastOverlay!: Adw.ToastOverlay;`
         * is where we actually declare the field. Template children are handled by GJS,
         * but we need to tell TypeScript that they exist. We prepend the underscore
         * so we match the name of the field that GJS will generate, and add
         * the exclamation point to tell the typescript compiler where to look.
         */
        GObject.registerClass(
            {
                Template:
                    'resource:///com/github/Aylur/ags/window.ui',
                InternalChildren: ['toastOverlay'],
            },
            this
        );

        // Widgets allow you to directly add shortcuts to them when subclassing
        Gtk.Widget.add_shortcut(
            new Gtk.Shortcut({
                action: new Gtk.NamedAction({ action_name: 'window.close' }),
                trigger: Gtk.ShortcutTrigger.parse_string('<Control>w'),
            })
        );
    }

    constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProperties>) {
        super(params);

        /**
         * Actions can also have parameters. In order to allow developers
         * to choose different types of parameters for their application,
         * we need to use something called a `GVariant`. When creating the
         * application we pass a string that denotes the type of the variant.
         *
         * For more information on variants, see:
         *  - https://docs.gtk.org/glib/struct.Variant.html
         *  - https://docs.gtk.org/glib/struct.VariantType.html
         */
        const openLink = new Gio.SimpleAction({
            name: 'open-link',
            parameter_type: GLib.VariantType.new('s'),
        });

        openLink.connect('activate', (_source, param) => {
            if (param) {
                // When using a variant parameter, we need to get the type we expect
                const link = param.get_string()[0];

                const launcher = new Gtk.UriLauncher({ uri: link });

                /**
                 * NOTE: The Typescript definition generator is not perfect,
                 * so you may see cases like this. We disable ESLint because
                 * we know for sure that this function exists, takes these
                 * arguments, and returns the right values.
                 */

                /* eslint-disable @typescript-eslint/no-unsafe-call */
                /* eslint-disable @typescript-eslint/no-unsafe-member-access */
                launcher
                    .launch(this, null)
                    // @ts-expect-error GtkUriLauncher.launch isn't properly generated in our type defs
                    .then(() => {
                        const toast = new Adw.Toast({
                            title: _('Opened link'),
                        });
                        this._toastOverlay.add_toast(toast);
                    })
                    .catch(console.error);
            }
        });

        this.add_action(openLink);
    }
}
