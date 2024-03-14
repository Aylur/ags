import Gio from 'gi://Gio';
import Service from '../service.js';
import { CACHE_DIR, ensureDirectory, readFile, writeFile } from '../utils.js';

const APPS_CACHE_DIR = `${CACHE_DIR}/apps`;
const CACHE_FILE = APPS_CACHE_DIR + '/apps_frequency.json';

export class Application extends Service {
    static {
        Service.register(this, {}, {
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

    private _app: Gio.DesktopAppInfo;
    private _frequency: number;

    get app() { return this._app; }

    get frequency() { return this._frequency; }
    set frequency(value) {
        this._frequency = value;
        this.changed('frequency');
    }

    get name() { return this._app.get_name(); }
    get desktop() { return this._app.get_id(); }
    get description() { return this._app.get_description(); }
    get wm_class() { return this._app.get_startup_wm_class(); }
    get executable() { return this._app.get_string('Exec') || this._app.get_executable(); }
    get icon_name() { return this._app.get_string('Icon'); }

    constructor(app: Gio.DesktopAppInfo, frequency?: number) {
        super();
        this._app = app;
        this._frequency = frequency || 0;
    }

    private _match(prop: string | null, search: string) {
        if (!prop)
            return false;

        if (!search)
            return true;

        return prop?.toLowerCase().includes(search.toLowerCase());
    }

    readonly getKey = (key: string) => {
        return this._app.get_string(key);
    };

    readonly match = (term: string) => {
        const { name, desktop, description, executable } = this;
        return this._match(name, term) ||
            this._match(desktop, term) ||
            this._match(executable, term) ||
            this._match(description, term);
    };

    readonly launch = () => {
        this.app.launch([], null);
        this.frequency++;
    };
}

export class Applications extends Service {
    static {
        Service.register(this, {}, {
            'list': ['jsobject'],
            'frequents': ['jsobject'],
        });
    }

    private _list!: Application[];
    private _frequents: { [app: string]: number };

    readonly query = (term: string) => {
        return this._list.filter(app => app.match(term)).sort((a, b) => {
            return a.frequency < b.frequency ? 1 : 0;
        });
    };

    constructor() {
        super();
        Gio.AppInfoMonitor.get().connect('changed', this.reload.bind(this));

        try {
            this._frequents =
                JSON.parse(readFile(CACHE_FILE)) as { [app: string]: number };
        } catch (_) {
            this._frequents = {};
        }

        this.reload();
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
        this.changed('frequents');
    }

    readonly reload = () => {
        this._list = Gio.AppInfo.get_all()
            .filter(app => app.should_show())
            .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
            .filter(app => app)
            .map(app => new Application(app, this.frequents[app.get_id() || '']));

        this._list.forEach(app => app.connect('notify::frequency', () => {
            this._launched(app.desktop);
        }));

        this.changed('list');
    };
}

export const applications = new Applications;
export default applications;
