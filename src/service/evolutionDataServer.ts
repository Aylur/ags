import Service from '../service.js';
import EDataServer from 'gi://EDataServer';
import ECal from 'gi://ECal';
import ICalGLib from 'gi://ICalGLib';

async function _getSourceRegistry() {
    return new Promise((resolve, reject) => {
        EDataServer.SourceRegistry.new(null, (_registry, res) => {
            try {
                resolve(EDataServer.SourceRegistry.new_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}


async function _modifyObjects(
    client: ECal.Client,
    icalcomps: ICalGLib.Component[],
    mod: ECal.ObjModType,
    flags: ECal.OperationFlags) {
    return new Promise((resolve, reject) => {
        client.modify_objects(icalcomps, mod, flags, null, (client, res) => {
            try {
                resolve(client.modify_objects_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function _removeObject(
    client: ECal.Client,
    uid: string,
    rid: string | null,
    mod: ECal.ObjModType,
    flags: ECal.OperationFlags) {
    return new Promise((resolve, reject) => {
        client.remove_object(uid, rid, mod, flags, null, (client, res) => {
            try {
                resolve(client.remove_object_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function unused_createObject(
    client: ECal.Client,
    icalcomp: ICalGLib.Component,
    flags: ECal.OperationFlags) {
    return new Promise((resolve, reject) => {
        client.create_object(icalcomp, flags, null, (client, res) => {
            try {
                resolve(client.create_object_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function _getObjectListAsComps(
    client: ECal.Client,
    sexp: string) {
    return new Promise((resolve, reject) => {
        client.get_object_list_as_comps(sexp, null, (client, res) => {
            try {
                resolve(client.get_object_list_as_comps_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function _getView(client: ECal.Client, sexp: string): Promise<[boolean, ECal.ClientView]> {
    return new Promise((resolve, reject) => {
        client.get_view(sexp, null, (client, res) => {
            try {
                resolve(client.get_view_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function _getECalClient(source: EDataServer.Source, type: ECal.ClientSourceType): Promise<EDataServer.Client | null> {
    return new Promise((resolve, reject) => {
        ECal.Client.connect(
            source,
            type,
            0,
            null, (_source, res) => {
                try {
                    resolve(ECal.Client.connect_finish(res));
                } catch (e) {
                    reject(e);
                }
            });
    });
}


export class EvolutionDataServer extends Service {
    static {
        Service.register(
            this,
            {
                'tasklist-added': ['jsobject'],
                'tasklist-removed': ['jsobject'],
                'tasklist-changed': ['jsobject'],
                'calendar-added': ['jsobject'],
                'calendar-removed': ['jsobject'],
                'calendar-changed': ['jsobject'],
            },
            {},
        );
    }

    private _sourceRegistry!: EDataServer.SourceRegistry;

    constructor() {
        super();
        this._initRegistry().catch(logError);
    }

    async _initRegistry() {
        this._sourceRegistry = await _getSourceRegistry() as EDataServer.SourceRegistry;
        this._sourceRegistry.connect(
            'source-added',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this.emit('tasklist-added', source);
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_CALENDAR))
                    this.emit('calendar-added', source);
            },
        );
        this._sourceRegistry.connect(
            'source-removed',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this.emit('tasklist-removed', source);
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_CALENDAR))
                    this.emit('calendar-removed', source);
            },
        );
        this._sourceRegistry.connect(
            'source-changed',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this.emit('tasklist-chanded', source);
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_CALENDAR))
                    this.emit('calendar-chanded', source);
            },
        );
        this._sourceRegistry.list_sources(EDataServer.SOURCE_EXTENSION_TASK_LIST)
            .forEach(source => this.emit('tasklist-added', source));
        this._sourceRegistry.list_sources(EDataServer.SOURCE_EXTENSION_CALENDAR)
            .forEach(source => this.emit('calendar-added', source));
    }
}

const evolutionDataServer = new EvolutionDataServer();


export class CollectionObject extends Service {
    static {
        Service.register(
            this,
            {},
            {}
        );
    }

    protected _source;
    protected _client;

    constructor(source: ECal.Component, client: ECal.Client) {
        super();

        this._source = source;
        this._client = client;
    }

    //TODO some of these properties are Task/Event specific add more and split properly
    get uid() { return this._source.get_uid(); }
    get summary() { return this._source.get_summary()?.get_value()  || '';}
    set summary(summary: string) {this._source.set_summary(new ECal.ComponentText(summary, null));}
    get location() { return this._source.get_location() || '';}
    set location(location: string) { this._source.set_location(location);}
    get priority() {return this._source.get_priority();}
    set priority(priority) {this._source.set_priority(priority);}
    get percent_complete() {return this._source.get_percent_complete();}
    set percent_complete(percent) {this._source.set_percent_complete(percent);}
    get dtstart() {
        const dtstart = this._source.get_dtstart();
        if (!dtstart)
            return undefined;
        return this._ecalToDate(dtstart);
    }

    set dtstart(dtstart: Date | undefined) {
        if (!dtstart)
            this._source.set_dtstart(null);
        else
            this._source.set_dtstart(this._dateToEcal(dtstart));
    }

    get dtend() {
        const dtend = this._source.get_dtend();
        if (!dtend)
            return undefined;
        return this._ecalToDate(dtend);
    }

    set dtend(dtend: Date | undefined) {
        if (!dtend)
            this._source.set_dtend(null);
        else
            this._source.set_dtend(this._dateToEcal(dtend));
    }

    get due() {
        const due = this._source.get_due();
        if (!due)
            return undefined;
        return this._ecalToDate(due);
    }

    set due(due :Date | undefined) {
        if (!due)
            this._source.set_due(null);
        else
            this._source.set_due(this._dateToEcal(due));
    }

    get description() {
        const descriptions = this._source.get_descriptions();
        if (!descriptions)
            return '';
        return descriptions[0]?.get_value() || ''; }

    set description(desc: string) {
        this._source.set_descriptions([new ECal.ComponentText(desc, null)]);
    }

    get source() {return this._source;}
    set source(source) {
        //maybe detect what has changed and emit notify signals?
        this._source = source;
        this.emit('changed');
    }

    get status() {return this._source.get_status();}
    set status(status) {this._source.set_status(status);}
    async save() {
        return _modifyObjects(
            this._client,
            // @ts-ignore
            [this._source.get_icalcomponent()],
            ECal.ObjModType.ALL,
            ECal.OperationFlags.NONE,
        );
    }

    _ecalToDate(datetime: ECal.ComponentDateTime) {
        return new Date(
            datetime.get_value().as_timet_with_zone(ECal.util_get_system_timezone()) * 1000);
    }

    _dateToEcal(datetime: Date) {
        const icaltime = ICalGLib.Time.new_from_timet_with_zone(
            datetime.getTime() / 1000, 0, ECal.util_get_system_timezone());
        icaltime.set_timezone(ECal.util_get_system_timezone());
        return new ECal.ComponentDateTime(icaltime, null);
    }
}

interface ICollection {
    new(source: EDataServer.Source): Collection;
}

export class Collection extends Service {
    static {
        Service.register(
            this,
            {
              'ready': [],
            },
            {},
        );
    }

    protected _client!: ECal.Client;
    protected _clientView!: ECal.ClientView;
    protected _source;
    protected type: ECal.ClientSourceType;

    constructor(source: EDataServer.Source, type: ECal.ClientSourceType) {
        super();

        this._source = source;
        this.type = type;
        this._initCollection().catch(logError);
    }

    async queryObjects(sexp: string) {
        //@ts-ignore
        return _getObjectListAsComps(this._client, sexp)
            .then(res => {
                const [_, list] = res as [boolean, ECal.Component[]];
                return list;
            });
    }

    get display_name() {
        return this._source.display_name;
    }

    get uid() {
        return this._source.uid;
    }

    delete(uid: string) {
        //TODO: let the user choose if delete all occurrences of the event or a specific one
        return _removeObject(
            this._client, uid, null, ECal.ObjModType.ALL, ECal.OperationFlags.NONE);
    }

    async _initCollection() {
        this._client = await _getECalClient(
            this._source, this.type) as ECal.Client;
        [, this._clientView] = await _getView(this._client, '#t');
        this._clientView.connect("objects-added", () => this.emit('changed'));
        this._clientView.connect("objects-removed", () => this.emit('changed'));
        this._clientView.connect("objects-modified", () => this.emit('changed'));
        this._clientView.start();

        this.emit('ready');
        this.emit('changed');
    }
}

export class CollectionTypeService extends Service {
    static {
        Service.register(
            this,
            {
              'collection-added': ['jsobject'],
              'collection-removed': ['jsobject'],
              'collection-changed': ['jsobject'],
            },
            {},
        );
    }

    protected _collections = new Map();
    private readonly ctor;

    constructor(type: string, ctor: ICollection) {
        super();
        this.ctor = ctor;
        evolutionDataServer.connect(`${type}-added`, this._CollectionAdded.bind(this));
        evolutionDataServer.connect(`${type}-removed`, this._CollectionRemoved.bind(this));
        evolutionDataServer.connect(`${type}-changed`, this._CollectionChanged.bind(this));
    }

    get collections() {
        return Array.from(this._collections.values());
    }

    _CollectionAdded(registry: EvolutionDataServer, source: EDataServer.Source) {
        if (!this._collections.has(source.uid)) {
            const tl = new this.ctor(source);
            // tl.connect('changed', () => this.emit('changed'));
            tl.connect('ready', () => {
              this._collections.set(source.uid, tl);
              this.emit('collection-added', tl);
              this.emit('changed');
            });
        }
    }

    _CollectionRemoved(registry: EvolutionDataServer, source: EDataServer.Source) {
        this.emit('collection-removed', this._collections.get(source.uid));
        this._collections.delete(source.uid);
        this.emit('changed');
    }

    _CollectionChanged(registry: EvolutionDataServer, source: EDataServer.Source) {
        this._collections.get(source.uid).emit('changed');
        this.emit('collection-changed', this._collections.get(source.uid));
        this.emit('changed');
    }
}

export default evolutionDataServer;
