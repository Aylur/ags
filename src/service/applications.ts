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

    _app: Gio.DesktopAppInfo;
    _frequency: number;

    get app() { return this._app; }

    get frequency() { return this._frequency; }
    set frequency(value) {
        if (value < 0)
            value = 0;

        this._frequency = value;
        this.emit('launched');
    }

    get name() { return this._app.get_name(); }
    get desktop() { return this._app.get_id(); }
    get description() { return this._app.get_description(); }
    get wm_class() { return this._app.get_startup_wm_class(); }
    get executable() { return this._app.get_executable(); }
    get icon_name() { return this._app.get_string('Icon'); }

    constructor(app: Gio.DesktopAppInfo, frequency: number) {
        super();
        this._app = app;
        this._frequency = frequency;
    }

    private _match(prop: string | null, search: string) {
        if (!prop)
            return false;

        if (!search)
            return true;

        return prop?.toLowerCase().includes(search.toLowerCase());
    }

    getKey(key: string) {
        return this._app.get_string(key);
    }

    match(term: string) {
        const { name, desktop, description, executable } = this;
        return this._match(name, term) ||
            this._match(desktop, term) ||
            this._match(executable, term) ||
            this._match(description, term);
    }

    launch() {
        this._frequency++;
        this.app.launch([], null);
        this.emit('launched');
    }
}

class ApplicationsService extends Service {
    static {
        Service.register(this, {}, {
            'list': ['jsobject'],
            'frequents': ['jsobject'],
        });
    }

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

    get list() { return this._list; }
    get frequents() { return this._frequents; }

    private _launched(id: string | null) {
        if (!id)
            return;

        typeof this._frequents[id] === 'number'
            ? this._frequents[id] += 1
            : this._frequents[id] = 1;

        ensureDirectory(APPS_CACHE_DIR);
        const json = JSON.stringify(this._frequents, null, 2);
        writeFile(json, CACHE_FILE).catch(err => console.error(err));
        this.notify('frequents');
        this.emit('changed');
    }

    private _sync() {
        this._list = Gio.AppInfo.get_all()
            .filter(app => app.should_show())
            .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
            .filter(app => app)
            .map(app => new Application(app, this.frequents[app.get_id() || ''] || 0));

        this._list.forEach(app => app.connect('launched', () => {
            this._launched(app.desktop);
        }));

        this.notify('list');
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
