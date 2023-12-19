import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Service from '../service.js';
import App from '../app.js';

interface ProcStat {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  guest: number;
  guest_nice: number;
}

export class Cpu extends Service {
    static {
        Service.register(
            this,
            {
                'closed': [],
            },
            {
                'usage': ['float'],
                'user': ['int'],
                'nice': ['int'],
                'system': ['int'],
                'idle': ['int'],
                'iowait': ['int'],
                'irq': ['int'],
                'softirq': ['int'],
                'steal': ['int'],
                'guest': ['int'],
                'guest_nice': ['int'],
            },
        );
    }

    private stats: ProcStat;
    private _usage = 0;
    private cancellable: Gio.Cancellable;
    private stream: Gio.DataInputStream;
    private timeoutId: number;

    get user() {
        return this.stats.user;
    }

    get nice() {
        return this.stats.nice;
    }

    get system() {
        return this.stats.system;
    }

    get idle() {
        return this.stats.idle;
    }

    get iowait() {
        return this.stats.iowait;
    }

    get irq() {
        return this.stats.irq;
    }

    get softirq() {
        return this.stats.softirq;
    }

    get steal() {
        return this.stats.steal;
    }

    get guest() {
        return this.stats.guest;
    }

    get guest_nice() {
        return this.stats.guest_nice;
    }

    get usage() {
        return this._usage;
    }

    constructor() {
        super();

        const file = Gio.File.new_for_path('/proc/stat');
        this.cancellable = new Gio.Cancellable();
        this.stream = new Gio.DataInputStream({ base_stream: file.read(this.cancellable) });
        this.stats = this.readStats();
        this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            const oldStats = this.stats;
            this.stats = this.readStats();
            this._usage = calcCpuUsage(oldStats, this.stats);
            this.notify('usage');
            this.notify('user');
            this.notify('nice');
            this.notify('system');
            this.notify('idle');
            this.notify('iowait');
            this.notify('irq');
            this.notify('softirq');
            this.notify('steal');
            this.notify('guest');
            this.notify('guest_nice');
            this.emit('changed');
            return true;
        });

        App.connect('shutdown', this.close);
    }

    private readStats(): ProcStat {
        this.stream.seek(0, GLib.SeekType.SET, this.cancellable);
        const [line] = this.stream.read_line_utf8(this.cancellable);
        const [
            _,
            user, nice, system, idle, iowait,
            irq, softirq, steal, guest, guest_nice,
        ] = line?.split(/\s+/) || ['cpu', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'];
        return {
            user: parseInt(user),
            nice: parseInt(nice),
            system: parseInt(system),
            idle: parseInt(idle),
            iowait: parseInt(iowait),
            irq: parseInt(irq),
            softirq: parseInt(softirq),
            steal: parseInt(steal),
            guest: parseInt(guest),
            guest_nice: parseInt(guest_nice),
        };
    }

    private close() {
        GLib.source_remove(this.timeoutId);
        this.stream.close(this.cancellable);
    }

    connect(event = 'changed', callback: (...args: any[]) => void) {
        return super.connect(event, callback);
    }
}

function calcCpuUsage(old: ProcStat, curr: ProcStat): number {
    const oldIdle = old.idle + old.iowait;
    const oldBusy = old.user + old.nice + old.system + old.irq + old.softirq + old.steal;
    const oldTotal = oldIdle + oldBusy;

    const currentIdle = curr.idle + curr.iowait;
    const currentBusy = curr.user + curr.nice + curr.system + curr.irq + curr.softirq + curr.steal;
    const currentTotal = currentIdle + currentBusy;

    const totalDiff = currentTotal - oldTotal;
    const idleDiff = currentIdle - oldIdle;

    return (totalDiff - idleDiff) / totalDiff;
}

export const cpu = new Cpu();
export default cpu;
