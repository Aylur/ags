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
            {},
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
    private stream: Gio.DataInputStream;
    private timeoutId: number;

    // The total amount of time spent on normal processes executing in user mode
    get user() {
        return this.stats.user;
    }

    // The total amount of time spent on niced (lower priority) processes executing in user mode
    get nice() {
        return this.stats.nice;
    }

    // The total amount of time spent on processes executing in kernel mode
    get system() {
        return this.stats.system;
    }

    // The total amount of time spent not executing any processes
    get idle() {
        return this.stats.idle;
    }

    // The total amount of time tasks have spent waiting on I/O to complete
    get iowait() {
        return this.stats.iowait;
    }

    // The total amount of time the processor has spent servicing hard interrupts
    get irq() {
        return this.stats.irq;
    }

    // The total amount of time the processor has spent servicing deferrable interrupts
    get softirq() {
        return this.stats.softirq;
    }

    // The total amount of time virtual cpus are involuntarily waiting on physical cpus
    // for processing time
    get steal() {
        return this.stats.steal;
    }

    // The total amount of time runnning virtual cpu processes
    get guest() {
        return this.stats.guest;
    }

    // The total amount of time running niced (lower priority) virtual cpu processes
    get guest_nice() {
        return this.stats.guest_nice;
    }

    get usage() {
        return this._usage;
    }

    constructor() {
        super();

        const file = Gio.File.new_for_path('/proc/stat');
        this.stream = new Gio.DataInputStream({ base_stream: file.read(null) });
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

        App.connect('shutdown', () => {
            GLib.source_remove(this.timeoutId);
            this.stream.close(null);
        });
    }

    private readStats(): ProcStat {
        this.stream.seek(0, GLib.SeekType.SET, null);
        const [line] = this.stream.read_line_utf8(null);
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
