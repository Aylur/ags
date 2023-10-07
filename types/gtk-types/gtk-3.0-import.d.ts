

type Gtk30 = typeof import('./gtk-3.0.js').default;

declare global {
    export interface GjsGiImports {
        Gtk: Gtk30;
    }
}

export default GjsGiImports;


