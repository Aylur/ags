import Gdk from 'gi://Gdk?version=3.0';
import type Gio from 'gi://Gio';
import Service from '../service.js';

//@ts-expect-error missing types
import GUtils from 'gi://GUtils';

export class Output extends Service {
    static {
        Service.register(this, {}, {
            'focused-tags': ['int'],
            'view-tags': ['jsobject'],
            'urgent-tags': ['int'],
            'layout-name': ['jsobject'],
        });
    }

    private _focusedTags = 0;
    private _viewTags: number[] = [];
    private _urgentTags = 0;
    private _layoutName: string | null = null;

    // Hold a reference to prevent garbage collection
    private readonly _output: GUtils.RiverOutput;

    constructor(output: GUtils.RiverOutput) {
        super();

        this._output = output;

        output.connect('focused-tags', (_: GUtils.RiverOutput, tags: number) => {
            this.updateProperty('focused-tags', tags);
        });

        output.connect('view-tags', (_: GUtils.RiverOutput, tags: number[]) => {
            this.updateProperty('view-tags', tags);
        });

        output.connect('urgent-tags', (_: GUtils.RiverOutput, tags: number) => {
            this.updateProperty('urgent-tags', tags);
        });

        output.connect('layout-name', (_: GUtils.RiverOutput, name: string | null) => {
            this.updateProperty('layout-name', name);
        });
    }

    get focusedTags() { return this._focusedTags; }
    get viewTags() { return this._viewTags; }
    get urgentTags() { return this._urgentTags; }
    get layoutName() { return this._layoutName; }
}

export class River extends Service {
    static {
        Service.register(this, {}, {
            'focused-view': ['string'],
        });
    }

    private _focusedView = '';
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
    }

    get focusedView() { return this._focusedView; }
    get connected() { return this._connected; }

    readonly getOutput = (monitor: number | Gdk.Monitor) => {
        let m: Gdk.Monitor | null;
        if (typeof monitor === 'number') {
            m = Gdk.Display.get_default()?.get_monitor(monitor) ?? null;
            if (m == null)
                return null;
        } else {
            m = monitor;
        }

        const output = new GUtils.RiverOutput({ monitor: m });
        const result = new Output(output);
        output.listen(this._river);

        if (!output.connected) {
            return null;
        }

        return result;
    }

    readonly sendCommand = (...args: string[]) => new Promise((resolve, reject) => {
        this._river.send_command(args, 0, null, (_: unknown, res: Gio.AsyncResult) => {
            try {
                resolve(this._river.send_command_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

export const river = new River;
export default river;
