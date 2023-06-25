import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=3.0';
import Service from './service.js';

interface App {
  app: Gio.AppInfo
  name: string
  desktop: string|null
  description: string|null
  executable: string
  iconName: string
  launch: () => void
  match: (term: string) => boolean
}

function _appIconName(app: Gio.AppInfo): string {
    if (!app.get_icon())
        return '';

    // @ts-ignore
    if (typeof app.get_icon()?.get_names !== 'function')
        return '';

    // @ts-ignore
    const name = app.get_icon()?.get_names()[0];
    return name || '';
}

function _match(prop: string|null, search: string): boolean {
    if (!prop)
        return false;

    if (!search)
        return true;

    return prop?.toLowerCase().includes(search.toLowerCase());
}

function _search(app: App, search: string): boolean {
    const { name, desktop, description, executable } = app;
    return  _match(name, search) ||
            _match(desktop, search) ||
            _match(executable, search) ||
            _match(description, search);
}

function _wrapper(app: Gio.AppInfo): App {
    return {
        app,
        name: app.get_name(),
        desktop: app.get_id(),
        executable: app.get_executable(),
        description: app.get_description(),
        iconName: _appIconName(app),
        launch: () => app.launch([], null),
        match: (term: string) => _search(_wrapper(app), term),
    };
}

class ApplicationsService extends Service {
    static { Service.register(this); }
    private _list!: App[];

    query(term: string) {
        return this._list.filter(app => _search(app, term));
    }

    constructor() {
        super();
        Gio.AppInfoMonitor.get()
            .connect('changed', this._sync.bind(this));

        this._sync();
    }

    _sync() {
        this._list = Gio.AppInfo.get_all()
            .filter(app => app.should_show())
            .map(app => _wrapper(app));

        this.emit('changed');
    }
}

export default class Applications {
    static { Service.export(this, 'Applications'); }
    static _instance: ApplicationsService;

    static query(term: string) {
        Service.ensureInstance(Applications, ApplicationsService);
        return Applications._instance.query(term);
    }

    static connect(widget: Gtk.Widget, callback: () => void) {
        Service.ensureInstance(Applications, ApplicationsService);
        Applications._instance.listen(widget, callback);
    }
}
