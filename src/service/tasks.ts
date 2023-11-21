import Service from '../service.js';
import EDataServer from 'gi://EDataServer';
import ECal from 'gi://ECal';
import ICalGLib from 'gi://ICalGLib';

//doesn't work. maybe because these methods are static?
//Gio._promisify(EDataServer.SourceRegistry.prototype, "new");
//Gio._promisify(ECal.Client.prototype, "connect");

//stopped working after moving to a builtin service, but why?
//Gio._promisify(ECal.Client.prototype, 'get_view');
//Gio._promisify(ECal.Client.prototype, 'get_object_list_as_comps');
//Gio._promisify(ECal.Client.prototype, 'modify_objects');

//promisify myself then

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

async function _createObject(
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

async function _getView(client: ECal.Client, sexp: string) {
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

async function _getECalClient(source: EDataServer.Source, type: ECal.ClientSourceType) {
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

class Task extends Service {
    static {
        Service.register(
            this,
            {},
            {},
        );
    }

    private _source;
    private _client;
    private _parentTask?: string;
    private _subTasks = new Set<string>();

    constructor(source: ECal.Component, client: ECal.Client) {
        super();

        this._source = source;
        this._client = client;
    }

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
        return new Date(
            dtstart.get_value().as_timet_with_zone(ECal.util_get_system_timezone()) * 1000);
    }

    set dtstart(dtstart :Date | undefined) {
        if (!dtstart) {
            this._source.set_dtstart(null);
        }
        else {
            const icaltime = ICalGLib.Time.new_from_timet_with_zone(
                dtstart.getTime()/1000, 0, ECal.util_get_system_timezone());
            icaltime.set_timezone(ECal.util_get_system_timezone());
            const ecaldate = new ECal.ComponentDateTime(icaltime, null);
            this._source.set_dtstart(ecaldate);
        }
    }

    get due() {
        const due = this._source.get_due();
        if (!due)
            return undefined;
        return new Date(due.get_value().as_timet_with_zone(ECal.util_get_system_timezone()) * 1000);
    }

    set due(due :Date | undefined) {
        if (!due) {
            this._source.set_due(null);
        }
        else {
            const icaltime = ICalGLib.Time.new_from_timet_with_zone(
                due.getTime()/1000, 0, ECal.util_get_system_timezone());
            icaltime.set_timezone(ECal.util_get_system_timezone());
            const ecaldate = new ECal.ComponentDateTime(icaltime, null);
            this._source.set_due(ecaldate);
        }
    }

    get description() {
        //Tasks can have at most one description, so just get [0]
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

    get subTasks() { return this._subTasks;}
    get parentTask() { return this._parentTask;}
    set parentTask(parentTask) { this._parentTask = parentTask; }
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
}

class TaskList extends Service {
    static {
        Service.register(
            this,
            {
                'task-added': ['string'],
                'task-removed': ['string'],
                'task-changed': ['string'],
            },
            {
                'tasks': ['jsobject', 'r'],
            },
        );
    }

    private _tasks = new Map();
    private _client!: ECal.Client;
    private _clientView!: ECal.ClientView;
    private _source;

    constructor(source: EDataServer.Source) {
        super();

        this._source = source;

        this._initTaskList().catch(logError);
    }

    get tasks() {
        return Array.from(this._tasks.values());
    }

    getTask(uid: string) {
        return this._tasks.get(uid);
    }

    get display_name() {
        return this._source.display_name;
    }

    get uid() {
        return this._source.uid;
    }

    deleteTask(uid: string) {
        return _removeObject(
            this._client, uid, null, ECal.ObjModType.ALL, ECal.OperationFlags.NONE);
    }

    //@ts-ignore
    createTask({ summary, description, location, due, dtstart, priority, parentTask }) {
        //there is most likely a better way, but I'm currently too stupid to see it.
        const icalcomp = ICalGLib.Component.new_vtodo();
        const timezone = ECal.util_get_system_timezone() || ICalGLib.Timezone.get_utc_timezone();
        if (summary)
            icalcomp.add_property(ICalGLib.Property.new_summary(summary));
        if (description)
            icalcomp.add_property(ICalGLib.Property.new_description(description));
        if (location)
            icalcomp.add_property(ICalGLib.Property.new_location(location));
        if (priority)
            icalcomp.add_property(ICalGLib.Property.new_priority(priority));
        if (due) {
            const due_time = ICalGLib.Time.new_from_timet_with_zone(
                due.getTime() / 1000, 0, timezone);
            due_time.set_timezone(timezone);
            icalcomp.add_property(ICalGLib.Property.new_due(due_time));
        }
        if (dtstart) {
            const dtstart_time = ICalGLib.Time.new_from_timet_with_zone(
                dtstart.getTime() / 1000, 0, timezone);
            dtstart_time.set_timezone(timezone);
            icalcomp.add_property(ICalGLib.Property.new_dtstart(dtstart_time));
        }
        if (parentTask)
            icalcomp.add_property(ICalGLib.Property.new_relatedto(parentTask));
        return _createObject(this._client, icalcomp, ECal.OperationFlags.NONE);
    }

    async _initTaskList() {
        this._client = await _getECalClient(
            this._source, ECal.ClientSourceType.TASKS) as ECal.Client;
        //@ts-ignore
        const [_, view] = await _getView(this._client, '#t');
        this._clientView = view;
        view.connect('objects-added', (client: ECal.ClientView, icals: ICalGLib.Component[]) =>
            this._TasksAdded(client, icals));
        view.connect('objects-removed', this._TasksRemoved.bind(this));
        view.connect('objects-modified', this._TasksModified.bind(this));

        view.start();
    }

    _TasksAdded(unused_view: ECal.ClientView, icals: ICalGLib.Component[]) {
        icals.forEach(ical => {
            const task = new Task(ECal.Component.new_from_icalcomponent(ical), this._client);
            this._tasks.set(task.uid, task);
            this.emit('task-added', task.uid);
        });
        this._setupHierarchy();
        this.notify('tasks');
        this.emit('changed');
    }

    _TasksRemoved(view: ECal.ClientView, uids: ECal.ComponentId[]) {
        uids.forEach(uid => {
            this._tasks.delete(uid.get_uid());
            this.emit('task-removed', uid.get_uid());
        });
        this._setupHierarchy();
        this.notify('tasks');
        this.emit('changed');
    }

    _TasksModified(unused_view: ECal.ClientView, icals: ICalGLib.Component[]) {
        icals.forEach(ical => {
            const ecal = ECal.Component.new_from_icalcomponent(ical);
            this._tasks.get(ecal.get_uid()).source = ecal;
            this.emit('task-changed', ecal.get_uid());
        });
        this._setupHierarchy();
        this.notify('tasks');
        this.emit('changed');
    }

    _setupHierarchy() {
        this._tasks.forEach(task => {
            task._parentTask = undefined;
            task._subTasks.clear();
        });
        this._tasks.forEach(task => {
            const related = task.source
                .get_icalcomponent()
                ?.get_first_property(ICalGLib.PropertyKind.RELATEDTO_PROPERTY);
            if (!related)
                return;
            task.parentTask = related .get_value().get_string();
            this._tasks.get(task.parentTask).subTasks.add(task.uid);
        });
    }
}

class TaskService extends Service {
    static {
        Service.register(
            this,
            //todo add signals
            {},
            {
                'task-lists': ['jsobject'],
            },
        );
    }

    private _sourceRegistry!: EDataServer.SourceRegistry;
    private _taskLists = new Map();

    constructor() {
        super();
        this._initTaskLists();
    }

    get task_lists() {
        return Array.from(this._taskLists.values());
    }

    async _initTaskLists() {
        this._sourceRegistry = await _getSourceRegistry() as EDataServer.SourceRegistry;
        this._sourceRegistry.connect(
            'source-added',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this._TaskListAdded(self, source);
            },
        );
        this._sourceRegistry.connect(
            'source-removed',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this._TaskListRemoved(self, source);
            },
        );
        this._sourceRegistry.connect(
            'source-changed',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this._TaskListChanged(self, source);
            },
        );
        const sources = this._sourceRegistry.list_sources(
            EDataServer.SOURCE_EXTENSION_TASK_LIST,
        );
        sources.forEach(source => {
            this._TaskListAdded(this._sourceRegistry, source);
        });
    }

    _TaskListAdded(registry: EDataServer.SourceRegistry, source: EDataServer.Source) {
        if (!this._taskLists.has(source.uid)) {
            const tl = new TaskList(source);
            tl.connect('changed', () => this.emit('changed'));
            this._taskLists.set(source.uid, tl);
        }
        this.emit('changed');
    }

    _TaskListRemoved(registry: EDataServer.SourceRegistry, source: EDataServer.Source) {
        this._taskLists.delete(source.uid);
        this.emit('changed');
    }

    _TaskListChanged(registry: EDataServer.SourceRegistry, source: EDataServer.Source) {
        this._taskLists.get(source.uid).emit('changed');
        this.emit('changed');
    }
}

const service = new TaskService();
export default service;
