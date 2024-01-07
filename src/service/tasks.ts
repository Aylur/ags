import Service from '../service.js';
import EDataServer from 'gi://EDataServer';
import ECal from 'gi://ECal';
import ICalGLib from 'gi://ICalGLib';
import { CollectionTypeService, Collection, CollectionObject } from './evolutionDataServer.js';



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

class Task extends CollectionObject {
    static {
        Service.register(
            this,
            {},
            {},
        );
    }

    private _parentTask? :string;
    private _subTasks = new Set<string>;

    get parentTask() { return this._parentTask; }
    set parentTask(parentTask) { this._parentTask = parentTask; }
    get subTasks() { return this._subTasks; }
    constructor(source: ECal.Component, client: ECal.Client) {
        super(source, client);
    }
}

class TaskList extends Collection {
    static {
        Service.register(
            this,
            {},
            {},
        );
    }

    constructor(source: EDataServer.Source) {
        super(source, ECal.ClientSourceType.TASKS);
    }

    // TODO: add more functions to filter tasks, eg only get uncompleted
    async getTasks() {
        const tasks = await this.queryObjects('#t').then(tasks =>
            tasks.map(ecal => new Task(ecal, this._client)));
        this._setupHierarchy(tasks);
        return tasks;
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

    _setupHierarchy(tasks: Task[]) {
        const taskMap = new Map();
        tasks.forEach(task => {
            task.parentTask = undefined;
            task.subTasks.clear();
            taskMap.set(task.uid, task);
        });
        tasks.forEach(task => {
            const related = task.source
                .get_icalcomponent()
                ?.get_first_property(ICalGLib.PropertyKind.RELATEDTO_PROPERTY);
            if (!related)
                return;
            task.parentTask = related.get_value().get_string() || undefined;
            taskMap.get(task.parentTask).subTasks.add(task.uid);
        });
    }
}

export class TaskService extends CollectionTypeService {
    static {
        Service.register(
            this,
            {},
            {},
        );
    }

    constructor() {
        super('tasklist', TaskList);
    }

    get tasklists() { return this.collections; }
}


const taskService = new TaskService();
export default taskService;
