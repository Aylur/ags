

type Soup30 = typeof import('./soup-3.0.js').default;

declare global {
    export interface GjsGiImports {
        Soup: Soup30;
    }
}

export default GjsGiImports;


