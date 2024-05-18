import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type Event<Self> = (self: Self) => void
type Detail<Self> = (self: Self, year: number, month: number, day: number) => string | null


export type CalendarProps<
    Attr = unknown,
    Self = Calendar<Attr>,
> = BaseProps<Self, Gtk.Calendar.ConstructorProperties & {
    on_day_selected?: Event<Self>
    detail?: Detail<Self>,
}, Attr>;

export function newCalendar<
    Attr = unknown
>(...props: ConstructorParameters<typeof Calendar<Attr>>) {
    return new Calendar(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Calendar<Attr> extends Widget<Attr> { }
export class Calendar<Attr> extends Gtk.Calendar {
    static {
        register(this, {
            properties: {
                'date': ['jsobject', 'r'],
                'on-day-selected': ['jsobject', 'rw'],
                'detail': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: CalendarProps<Attr> = {}) {
        super(props as Gtk.Calendar.ConstructorProperties);
        this.connect('notify::day', () => this.notify('date'));
        this.connect('notify::month', () => this.notify('date'));
        this.connect('notify::year', () => this.notify('date'));
        this.connect('day-selected', this.on_day_selected.bind(this));
    }

    get date() { return this.get_date(); }

    get on_day_selected() { return this._get('on-day-selected') || (() => false); }
    set on_day_selected(callback: Event<this>) { this._set('on-day-selected', callback); }

    get detail() { return this._get('detail-func'); }
    set detail(func: Detail<this>) {
        this._set('detail-func', func);
        this.set_detail_func((self, ...date) => func(self as this, ...date));
    }
}

export default Calendar;
