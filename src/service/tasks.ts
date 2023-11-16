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
                resolve(client.modify_object_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function _getObjectListAsComps(client: ECal.Client, sexp: string) {
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

    private _task;
    private _client;
    private _parentTask?: string;
    private _subTasks = new Set<string>();

    constructor(task: ECal.Component, client: ECal.Client) {
        super();

        this._task = task;
        this._client = client;
    }

    get uid() {
        return this._task.get_uid();
    }

    get summary() {
        return this._task.get_summary()?.get_value();
    }

    get subTasks() {
        return this._subTasks;
    }

    get parentTask() {
        return this._parentTask;
    }

    set parentTask(parentTask) {
        this._parentTask = parentTask;
    }

    get completed() {
        return this._task.get_status() === ICalGLib.PropertyStatus.COMPLETED;
    }

    set completed(completed) {
        if (completed === this.completed)
            return;
        const status = completed
            ? ICalGLib.PropertyStatus.COMPLETED
            : ICalGLib.PropertyStatus.NONE;
        this._task.set_status(status);
        _modifyObjects(
            this._client,
            // @ts-ignore
            [this._task.get_icalcomponent()],
            ECal.ObjModType.THIS,
            ECal.OperationFlags.NONE,
        );
    }
}

class TaskList extends Service {
    static {
        Service.register(
            this,
            {},
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

    async _initTaskList() {
        this._client = await _getECalClient(
            this._source, ECal.ClientSourceType.TASKS) as ECal.Client;
        //@ts-ignore
        const [_, view] = await _getView(this._client, '#t');
        this._clientView = view;
        view.connect('objects-added', (client: ECal.ClientView, icals: ICalGLib.Component[]) =>
            this._TasksAdded(client, icals).catch(logError));
        view.connect('objects-removed', this._TasksRemoved.bind(this));
        view.connect('objects-modified', this._TasksModified.bind(this));

        view.start();
    }

    async _TasksAdded(unused_view: ECal.ClientView, unused_icals: ICalGLib.Component[]) {
        //@ts-ignore
        const [_, tasks] =
            await _getObjectListAsComps(this._client, '#t') as [boolean, ECal.Component[]];
        tasks.forEach(t => {
            this._tasks.set(t.get_uid(), new Task(t, this._client));
        });
        this._setupHierarchy();
        this.notify('tasks');
        this.emit('changed');
    }

    _TasksRemoved(view: ECal.ClientView, uids: ECal.ComponentId[]) {
        uids.forEach(uid => {
            this._tasks.delete(uid.get_uid());
        });
        this._setupHierarchy();
        this.notify('tasks');
        this.emit('changed');
    }

    async _TasksModified(unused_view: ECal.ClientView, unused_icals: ICalGLib.Component[]) {
        //@ts-ignore
        const [_, tasks] =
            await _getObjectListAsComps(this._client, '#t') as [boolean, ECal.Component[]];
        tasks.forEach(t => {
            this._tasks.set(t.get_uid(), new Task(t, this._client));
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
            const related = task._task
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
        // @ts-ignore
        this._sourceRegistry.connect(
            'source-added',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this._TaskListAdded(self, source);
            },
        );
        // @ts-ignore
        this._sourceRegistry.connect(
            'source-removed',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this._TaskListRemoved(self, source);
            },
        );
        // @ts-ignore
        this._sourceRegistry.connect(
            'source-changed',
            (self, source) => {
                if (source.has_extension(EDataServer.SOURCE_EXTENSION_TASK_LIST))
                    this._TaskListChanged(self, source);
            },
        );
        // @ts-ignore
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
