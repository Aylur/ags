import Gio from 'gi://Gio';
import Service from './service.js';
import GObject from 'gi://GObject';
import { CACHE_DIR, ensureDirectory, readFile, writeFile } from '../utils.js';

const APPS_CACHE_DIR = `${CACHE_DIR}/apps`;
const CACHE_FILE = APPS_CACHE_DIR + '/apps_frequency.json';

class Application extends GObject.Object {
    static { GObject.registerClass(this); }

    app: Gio.DesktopAppInfo;
    frequency: number;
    name: string;
    desktop: string | null;
    description: string | null;
    wmClass: string | null;
    executable: string;
    iconName: string;
    service: ApplicationsService;

    constructor(app: Gio.DesktopAppInfo, service: ApplicationsService) {
        super();
        this.service = service;
        this.app = app;
        this.name = app.get_name();
        this.desktop = app.get_id();
        this.executable = app.get_executable();
        this.description = app.get_description();
        this.iconName = this._iconName(app);
        this.wmClass = app.get_startup_wm_class();
        this.frequency = this.desktop && service.frequents[this.desktop] || 0;
    }

    _iconName(app: any): string {
        if (!app.get_icon())
            return '';

        if (typeof app.get_icon()?.get_names !== 'function')
            return '';

        const name = app.get_icon()?.get_names()[0];
        return name || '';
    }

    _match(prop: string | null, search: string) {
        if (!prop)
            return false;

        if (!search)
            return true;

        return prop?.toLowerCase().includes(search.toLowerCase());
    }

    match(term: string) {
        const { name, desktop, description, executable } = this;
        return this._match(name, term) ||
            this._match(desktop, term) ||
            this._match(executable, term) ||
            this._match(description, term);
    }

    launch() {
        this.frequency++;
        this.service._launched(this.desktop);
        this.app.launch([], null);
    }
}

class ApplicationsService extends Service {
    static {
        Service.register(this, {
            'launched': ['string'],
        });
    }

    private _list!: Application[];
    frequents: { [app: string]: number };

    query(term: string) {
        return this._list.filter(app => app.match(term)).sort((a, b) => {
            return a.frequency < b.frequency ? 1 : 0;
        });
    }

    constructor() {
        super();
        Gio.AppInfoMonitor.get().connect('changed', this._sync.bind(this));

        try {
            this.frequents =
                JSON.parse(readFile(CACHE_FILE)) as { [app: string]: number };
        } catch (_) {
            this.frequents = {};
        }

        this._sync();
    }

    _launched(id: string | null) {
        if (!id)
            return;

        typeof this.frequents[id] === 'number'
            ? this.frequents[id] += 1
            : this.frequents[id] = 1;

        ensureDirectory(APPS_CACHE_DIR);
        const json = JSON.stringify(this.frequents, null, 2);
        writeFile(json, CACHE_FILE).catch(logError);
    }

    _sync() {
        this._list = Gio.AppInfo.get_all()
            .filter(app => app.should_show())
            .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
            .filter(app => app)
            .map(app => new Application(app, this));

        this.emit('changed');
    }
}

export default class Applications {
    static { Service.export(this, 'Applications'); }
    static _instance: ApplicationsService;

    static get instance() {
        Service.ensureInstance(Applications, ApplicationsService);
        return Applications._instance;
    }

    static frequents() {
        return Applications.instance.frequents;
    }

    static query(term: string) {
        return Applications.instance.query(term);
    }
}
