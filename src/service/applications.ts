import Gio from 'gi://Gio';
import Service from './service.js';
import { CACHE_DIR, ensureDirectory, readFile, writeFile } from '../utils.js';

const APPS_CACHE_DIR = `${CACHE_DIR}/apps`;
const CACHE_FILE = APPS_CACHE_DIR + '/apps_frequency.json';

class Application extends Service {
    static {
        Service.register(this, {
            'launched': [],
        }, {
            'app': ['jsobject'],
            'frequency': ['int'],
            'name': ['string'],
            'desktop': ['jsobject'],
            'description': ['jsobject'],
            'wm-class': ['jsobject'],
            'executable': ['string'],
            'icon-name': ['string'],
        });
    }

    app: Gio.DesktopAppInfo;
    frequency: number;
    name: string;
    desktop: string | null;
    description: string | null;
    wmClass: string | null;
    executable: string;
    iconName: string;
    service: ApplicationsService;

    // for binds compatibility
    get icon_name() { return this.iconName; }
    get wm_class() { return this.wmClass; }

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

    private _iconName(app: Gio.DesktopAppInfo): string {
        if (!app.get_icon())
            return '';

        // @ts-expect-error
        if (typeof app.get_icon()?.get_names !== 'function')
            return '';

        // @ts-expect-error
        const name = app.get_icon()?.get_names()[0];
        return name || '';
    }

    private _match(prop: string | null, search: string) {
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
        this.app.launch([], null);
        this.emit('launched');
    }
}

class ApplicationsService extends Service {
    static { Service.register(this); }

    private _list!: Application[];
    private _frequents: { [app: string]: number };

    query(term: string) {
        return this._list.filter(app => app.match(term)).sort((a, b) => {
            return a.frequency < b.frequency ? 1 : 0;
        });
    }

    constructor() {
        super();
        Gio.AppInfoMonitor.get().connect('changed', this._sync.bind(this));

        try {
            this._frequents =
                JSON.parse(readFile(CACHE_FILE)) as { [app: string]: number };
        } catch (_) {
            this._frequents = {};
        }

        this._sync();
    }

    get list() { return [...this._list]; }
    get frequents() { return this._frequents; }

    private _launched(id: string | null) {
        if (!id)
            return;

        typeof this._frequents[id] === 'number'
            ? this._frequents[id] += 1
            : this._frequents[id] = 1;

        ensureDirectory(APPS_CACHE_DIR);
        const json = JSON.stringify(this._frequents, null, 2);
        writeFile(json, CACHE_FILE).catch(logError);
    }

    private _sync() {
        this._list = Gio.AppInfo.get_all()
            .filter(app => app.should_show())
            .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
            .filter(app => app)
            .map(app => new Application(app, this));

        this._list.forEach(app => app.connect('launched', () => {
            this._launched(app.desktop);
        }));

        this.emit('changed');
    }
}

export default class Applications {
    static _instance: ApplicationsService;

    static get instance() {
        Service.ensureInstance(Applications, ApplicationsService);
        return Applications._instance;
    }

    static query(term: string) { return Applications.instance.query(term); }
    static get list() { return Applications.instance.list; }
    static get frequents() { return Applications.instance.frequents; }
}
