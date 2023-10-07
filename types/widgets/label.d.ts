import Gtk from 'gi://Gtk?version=3.0';
export interface Params {
    label?: string;
    [key: string]: unknown;
}
export default class AgsLabel extends Gtk.Label {
    constructor(params: Params | string);
    get label(): string;
    set label(label: string);
    get truncate(): string;
    set truncate(truncate: string);
    get justification(): string;
    set justification(justify: string);
}
