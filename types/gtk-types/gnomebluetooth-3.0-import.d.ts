

type GnomeBluetooth30 = typeof import('./gnomebluetooth-3.0.js').default;

declare global {
    export interface GjsGiImports {
        GnomeBluetooth: GnomeBluetooth30;
    }
}

export default GjsGiImports;


