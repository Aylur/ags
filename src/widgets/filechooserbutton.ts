import { register, type BaseProps, type Widget } from './widget.js';
import Gtk from 'gi://Gtk?version=3.0';

type Event<Self> = (self: Self) => void | boolean

export type FileChooserButtonProps<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
    Self = FileChooserButton<Child, Attr>,
> = BaseProps<Self, Gtk.FileChooserButton.ConstructorProperties & {
    child?: Child
    on_file_set?: Event<Self>
}, Attr>;

export function newFileChooserButton<
    Child extends Gtk.Widget = Gtk.Widget,
    Attr = unknown,
>(...props: ConstructorParameters<typeof FileChooserButton<Child, Attr>>) {
    return new FileChooserButton(...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface FileChooserButton<Child, Attr> extends Widget<Attr> { }
export class FileChooserButton<Child extends Gtk.Widget, Attr> extends Gtk.FileChooserButton {
    static {
        register(this, {
            properties: {
                'on-file-set': ['jsobject', 'rw'],
            },
        });
    }

    constructor(props: FileChooserButtonProps<Child, Attr> = {}, child?: Child) {
        if (child)
            props.child = child;

        super(props as Gtk.FileChooserButton.ConstructorProperties);
        this.connect('file-set', this.on_file_set.bind(this));
    }

    get child() { return super.child as Child; }
    set child(child: Child) { super.child = child; }

    get on_file_set() { return this._get('on-file-set') || (() => false); }
    set on_file_set(callback: Event<this>) { this._set('on-file-set', callback); }

    get uri() { return this.get_uri(); }
    get uris() { return this.get_uris(); }
}

export default FileChooserButton;
