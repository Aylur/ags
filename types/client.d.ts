interface Flags {
    busName: string;
    inspector: boolean;
    runJs: string;
    runPromise: string;
    toggleWindow: string;
    quit: boolean;
}
export default function (bus: string, path: string, flags: Flags): number | undefined;
export {};
