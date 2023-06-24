declare function print(...args: any[]): void;
declare function log(obj: object, others?: object[]): void;
declare function log(msg: string, subsitutions?: any[]): void;
declare function logError(err: Error, msg?: string): void;

declare const pkg: {
  version: string;
  name: string;
};

declare const imports: {
  config: any;
  gi: any;
  searchPath: string[];
}

declare module console {
  export function error(obj: object, others?: object[]): void;
  export function error(msg: string, subsitutions?: any[]): void;
}

declare interface String {
  format(...replacements: string[]): string;
  format(...replacements: number[]): string;
}

declare interface Number {
  toFixed(digits: number): number;
}

declare class TextDecoder {
  constructor(label?: string, options?: TextDecoderOptions);
  decode(input?: BufferSource, options?: TextDecodeOptions): string;
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
}

declare class TextEncoder {
  constructor();
  encode(input?: string): Uint8Array;
}
