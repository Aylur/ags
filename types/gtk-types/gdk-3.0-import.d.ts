

type Gdk30 = typeof import('./gdk-3.0.js').default;

declare global {
    export interface GjsGiImports {
        Gdk: Gdk30;
    }
}

export default GjsGiImports;


