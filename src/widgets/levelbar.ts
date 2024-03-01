import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type BarMode = 'continuous' | 'discrete'

export type LevelBarProps<
    Attr = unknown,
    Self = LevelBar<Attr>,
> = BaseProps<Self, Gtk.LevelBar.ConstructorProperties & {
    bar_mode?: BarMode
    vertical?: boolean
}, Attr>;

export function newLevelBar<
    Attr = unknown
>(...props: ConstructorParameters<typeof LevelBar<Attr>>) {
    return new LevelBar(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface LevelBar<Attr> extends Widget<Attr> { }
export class LevelBar<Attr> extends Gtk.LevelBar {
    static {
        register(this, {
            properties: {
                'bar-mode': ['string', 'rw'],
                'vertical': ['boolean', 'rw'],
            },
        });
    }

    constructor(props: LevelBarProps<Attr> = {}) {
        super(props as Gtk.LevelBar.ConstructorProperties);
        this.connect('notify::mode', () => this.notify('bar-mode'));
        this.connect('notify::orientation', () => this.notify('vertical'));
    }

    get bar_mode() {
        return this.mode === Gtk.LevelBarMode.CONTINUOUS ? 'continuous' : 'discrete';
    }

    set bar_mode(mode: BarMode) {
        this.mode = Gtk.LevelBarMode[mode === 'continuous' ? 'CONTINUOUS' : 'DISCRETE'];
    }

    get vertical() { return this.orientation === Gtk.Orientation.VERTICAL; }
    set vertical(v: boolean) {
        this.orientation = Gtk.Orientation[v ? 'VERTICAL' : 'HORIZONTAL'];
    }
}

export default LevelBar;
