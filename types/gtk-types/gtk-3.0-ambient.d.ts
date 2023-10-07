

declare module 'gi://Gtk?version=3.0' {
    const Gtk30: typeof import('./gtk-3.0.js').default;
    export default Gtk30;
}

declare module 'gi://Gtk' {
    const Gtk30: typeof import('./gtk-3.0.js').default;
    export default Gtk30;
}


