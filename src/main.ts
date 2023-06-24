import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';

import { Window } from './window.js';

/**
 * This class is the foundation of most complex applications.
 * It handles many things crucial for app developers:
 *  - Registers a D-Bus name for your application
 *  - Makes sure the application process is unique
 *  - Registers application resources like icons, ui files, menus, and shortcut dialogs.
 *  - Allows app developers to easily set up global actions and shortcuts
 *
 * Here we're using AdwApplication, which provides extra functionality by automatically
 * loading custom styles and initializing the libadwaita library.
 *
 * For more information on AdwApplication and its parent classes, see:
 *  - https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/class.Application.html
 *  - https://docs.gtk.org/gtk4/class.Application.html
 *  - https://docs.gtk.org/gio/class.Application.html
 */
export class Application extends Adw.Application {
    private window?: Window;

    /**
     * When subclassing a GObject, we need to register the class with the
     * GObject type system. We do this here in the static initializer block,
     * as it needs to be run before everything else.
     *
     * For more information on subclassing and the abilities of
     * `GObject.registerClass()`, see https://gjs.guide/guides/gobject/subclassing.html
     */
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super({
            application_id: 'com.github.Aylur.ags',
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        /**
         * GActions are the most powerful tool a developer can use
         * to react to user input. There are different types of actions,
         * and actions can be attached to UI and shortcuts in multiple ways.
         *
         * In this example we're using GSimpleAction, as it's simplest
         * implementation of actions provided by gio.
         *
         * For more information, see:
         *  - https://gnome.pages.gitlab.gnome.org/gtk/gio/iface.Action.html
         *  - https://gnome.pages.gitlab.gnome.org/gtk/gio/iface.ActionGroup.html
         *  - https://gnome.pages.gitlab.gnome.org/gtk/gio/iface.ActionMap.html
         *
         * The application class implements GActionGroup and GActionMap,
         * providing us the ability to add actions directly to the application.
         * When we want to refer to the action elsewhere, we use the name of the
         * action group we used as a prefix. Actions directly added to applications
         * are prefixed with `app`.
         */
        const quit_action = new Gio.SimpleAction({ name: 'quit' });
        quit_action.connect('activate', () => {
            this.quit();
        });

        this.add_action(quit_action);
        this.set_accels_for_action('app.quit', ['<Control>q']);

        const show_about_action = new Gio.SimpleAction({ name: 'about' });
        show_about_action.connect('activate', () => {
            const aboutWindow = new Adw.AboutWindow({
                transient_for: this.active_window,
                application_name: _('Aylur's Gtk Shell'),
                application_icon: 'com.github.Aylur.ags',
                developer_name: 'Aylur',
                version: '0.1',
                developers: ['Aylur <>'],
                copyright: '© 2023 Aylur',
            });

            aboutWindow.present();
        });

        this.add_action(show_about_action);

        Gio._promisify(Gtk.UriLauncher.prototype, 'launch', 'launch_finish');
    }

    // When overriding virtual functions, the function name must be `vfunc_$funcname`.
    public vfunc_activate(): void {
        if (!this.window) {
            this.window = new Window({ application: this });
        }

        this.window.present();
    }
}

export function main(argv: string[]): Promise<number> {
    const app = new Application();
    // @ts-expect-error gi.ts can't generate this, but it exists.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return app.runAsync(argv);
}
