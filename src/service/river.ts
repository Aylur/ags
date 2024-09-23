import Gdk from 'gi://Gdk?version=3.0';
import Service from '../service.js';

//@ts-expect-error missing types
import GUtils from 'gi://GUtils';

export class RiverMonitor extends Service {
    static {
        Service.register(this, {}, {
            'id': ['int'],
            'focused-tags': ['int'],
            'view-tags': ['jsobject'],
            'urgent-tags': ['int'],
        });
    }

    private _id = 0;
    private _focusedTags = 0;
    private _viewTags: number[] = [];
    private _urgentTags = 0;

    constructor(monitor: GUtils.RiverMonitor) {
        super();

        this.updateProperty('id', monitor.monitor);

        monitor.connect('focused-tags', (_: GUtils.RiverMonitor, tags: number) => {
            this.updateProperty('focused-tags', tags);
        });

        monitor.connect('view-tags', (_: GUtils.RiverMonitor, tags: number[]) => {
            this.updateProperty('view-tags', tags);
        });

        monitor.connect('urgent-tags', (_: GUtils.RiverMonitor, tags: number) => {
            this.updateProperty('urgent-tags', tags);
        });
    }

    get id() { return this._id; }
    get focusedTags() { return this._focusedTags; }
    get viewTags() { return this._viewTags; }
    get urgentTags() { return this._urgentTags; }
}

export class River extends Service {
    static {
        Service.register(this, {}, {
            'focused-view': ['string'],
            'monitors': ['jsobject'],
        });
    }

    private _focusedView = '';
    private _monitors: Map<number, RiverMonitor> = new Map();
    private _connected = false;

    private _river = new GUtils.River();

    constructor() {
        super();

        this._connected = this._river.valid;
        if (!this._connected) {
            console.error('River is not detected');
            return;
        }

        this._river.connect('focused-view', (_: any, title: string) => {
            this.updateProperty('focused-view', title);
        });
        this._river.listen();

        let numMonitors = Gdk.Display.get_default()?.get_n_monitors() ?? 0;
        for (let i = 0; i < numMonitors; i++) {
            const gMonitor = new GUtils.RiverMonitor({
                river: this._river,
                monitor: i,
            });

            const monitor = new RiverMonitor(gMonitor);
            gMonitor.listen();

            if (gMonitor.connected) {
                this._monitors.set(i, monitor);
            }
        }
    }

    get focusedView() { return this._focusedView; }
    get monitors() { return Array.from(this._monitors.values()); }
    get connected() { return this._connected; }

    readonly getMonitor = (id: number) => this._monitors.get(id);

    readonly sendCommand = (...args: string[]) => {
        this._river.send_command(args);
    }
}

export const river = new River;
export default river;
