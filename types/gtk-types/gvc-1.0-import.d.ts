

import Gvc10 from './gvc-1.0';

declare global {
    export interface GjsGiImports {
        Gvc: typeof Gvc10;
    }
}

export default GjsGiImports;