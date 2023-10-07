/**
 * Gjs has implemented some functionality from the DOM API,
 * this leads to a conflict when all DOM (`lib.dom.d.ts`) should be used.
 * This should normally not be the case, since the other - not yet reimplemented - API's cannot be used in GJS anyway.
 * In particular, Gjsify tries to rebuild the DOM API and therefore does not need these types.
 * For this reason they are stored in this separate file to make them optional.
 * 
 * See also https://github.com/microsoft/TypeScript/blob/main/lib/lib.dom.d.ts
 */

import type GLib from './glib-2.0.js';

declare global {

    // Timers
    // See https://gitlab.gnome.org/GNOME/gjs/-/blob/master/modules/esm/_timers.js

    /**
     * @version Gjs 1.71.1
     * @param callback a callback function
     * @param delay the duration in milliseconds to wait before running callback
     * @param args arguments to pass to callback
     */
    function setTimeout(callback: (...args: any[]) => any, delay?: number, ...args: any[]): GLib.Source

    /**
     * @version Gjs 1.71.1
     * @param callback a callback function
     * @param delay the duration in milliseconds to wait between calling callback
     * @param args arguments to pass to callback
     */
    function setInterval(callback: (...args: any[]) => any, delay?: number, ...args: any[]): GLib.Source

    /**
     * @version Gjs 1.71.1
     * @param timeout the timeout to clear
     */
    function clearTimeout(timeout: GLib.Source): void

    /**
     * @version Gjs 1.71.1
     * @param timeout the timeout to clear
     */
    function clearInterval(timeout: GLib.Source): void

    interface Console {
        /**
         * Logs a critical message if the condition is not truthy.
         * {@link console.error()} for additional information.
         *
         * @param condition a boolean condition which, if false, causes
         *   the log to print
         * @param data formatting substitutions, if applicable
         * @returns
         */
        assert(condition: boolean, ...data: any[]): void

        /**
         * Resets grouping and clears the terminal on systems supporting ANSI
         * terminal control sequences.
         *
         * In file-based stdout or systems which do not support clearing,
         * console.clear() has no visual effect.
         *
         */
        clear(): void

        /**
         * Logs a message with severity equal to {@link GLib.LogLevelFlags.DEBUG}.
         *
         * @param  {...any} data formatting substitutions, if applicable
         */
        debug(...data: any[]): void

        /**
         * Logs a message with severity equal to {@link GLib.LogLevelFlags.CRITICAL}.
         * Does not use {@link GLib.LogLevelFlags.ERROR} to avoid asserting and
         * forcibly shutting down the application.
         *
         * @param data formatting substitutions, if applicable
         */
        error(...data: any[]): void

        /**
         * Logs a message with severity equal to {@link GLib.LogLevelFlags.INFO}.
         *
         * @param data formatting substitutions, if applicable
         */
        info(...data: any[]): void

        /**
         * Logs a message with severity equal to {@link GLib.LogLevelFlags.MESSAGE}.
         *
         * @param data formatting substitutions, if applicable
         */
        log(...data: any[]): void

        // 1.1.7 table(tabularData, properties)
        table(tabularData: any, _properties: never): void

        /**
         * @param data formatting substitutions, if applicable
         */
        trace(...data: any[]): void

        /**
         * @param data formatting substitutions, if applicable
         */
        warn(...data: any[]): void

        /**
         * @param item an item to format generically
         * @param [options] any additional options for the formatter. Unused
         *   in our implementation.
         */
        dir(item: object, options: never): void

        /**
         * @param data formatting substitutions, if applicable
         */
        dirxml(...data: any[]): void

        // 1.2 Counting functions
        // https://console.spec.whatwg.org/#counting

        /**
         * Logs how many times console.count(label) has been called with a given
         * label.
         * {@link console.countReset()} for resetting a count.
         *
         * @param label unique identifier for this action
         */
        count(label: string): void

        /**
         * @param label the unique label to reset the count for
         */
        countReset(label: string): void

        // 1.3 Grouping functions
        // https://console.spec.whatwg.org/#grouping

        /**
         * @param data formatting substitutions, if applicable
         */
        group(...data: any[]): void

        /**
         * Alias for console.group()
         *
         * @param  {...any} data formatting substitutions, if applicable
         */
        groupCollapsed(...data: any[]): void

        /**
         */
        groupEnd(): void

        // 1.4 Timing functions
        // https://console.spec.whatwg.org/#timing

        /**
         * @param label unique identifier for this action, pass to
         *   console.timeEnd() to complete
         */
        time(label: string): void

        /**
         * Logs the time since the last call to console.time(label) where label is
         * the same.
         *
         * @param label unique identifier for this action, pass to
         *   console.timeEnd() to complete
         * @param data string substitutions, if applicable
         */
        timeLog(label: string, ...data: any[]): void

        /**
         * Logs the time since the last call to console.time(label) and completes
         * the action.
         * Call console.time(label) again to re-measure.
         *
         * @param label unique identifier for this action
         */
        timeEnd(label: string): void

        // Non-standard functions which are de-facto standards.
        // Similar to Node, we define these as no-ops for now.

        /**
         * @deprecated Not implemented in GJS
         *
         * @param _label unique identifier for this action, pass to
         *   console.profileEnd to complete
         */
        profile(_label: string): void

        /**
         * @deprecated Not implemented in GJS
         *
         * @param _label unique identifier for this action
         */
        profileEnd(_label: string): void

        /**
         * @deprecated Not implemented in GJS
         *
         * @param _label unique identifier for this action
         */
        timeStamp(_label: string): void

        // GJS-specific extensions for integrating with GLib structured logging

        /**
         * @param logDomain the GLib log domain this Console should print
         *   with. Defaults to 'Gjs-Console'.
         */
        setLogDomain(logDomain: string): void

        logDomain: string

        interact(): void
    }

    interface TextDecodeOptions {
        // As of Gjs 1.73.2 stream mode is not supported yet.
        // stream?: boolean
    }

    interface TextDecoderOptions {
        /** Indicates whether the error mode is fatal. */
        fatal?: boolean
        /** Indicates whether whether the byte order mark is ignored. */
        ignoreBOM?: boolean
    }

    /**
     * The TextDecoder interface represents a decoder for a specific text encoding.
     * It takes a stream of bytes as input and emits a stream of code points.
     *
     * @version Gjs 1.69.2
     */
    interface TextDecoder {
        /** A string containing the name of the decoder, that is a string describing the method the TextDecoder will use. */
        readonly encoding: TextDecoderEncoding
        /** A Boolean indicating whether the error mode is fatal. */
        readonly fatal: boolean
        /** A Boolean indicating whether the byte order mark is ignored. */
        readonly ignoreBOM: boolean

        /**
         * Returns a string containing the text decoded with the method of the specific TextDecoder object.
         *
         * If the error mode is "fatal" and the encoder method encounter an error it WILL THROW a TypeError.
         *
         * @param input Buffer containing the text to decode
         * @param options Object defining the decode options
         */
        decode(input?: ArrayBufferView | ArrayBuffer, options?: TextDecodeOptions): string
    }

    interface TextEncoderEncodeIntoResult {
        read?: number
        written?: number
    }

    /**
     * TextEncoder takes a stream of code points as input and emits a stream of bytes.
     *
     * @version Gjs 1.69.2
     */
    interface TextEncoder {
        readonly encoding: 'utf-8'

        /**
         * Takes a string as input, and returns a buffer containing the text given in parameters encoded with the UTF-8 method.
         *
         * @param input Text to encode.
         */
        encode(input?: string): Uint8Array
        /**
         * Takes a string to encode and a destination Uint8Array to put resulting UTF-8 encoded text into,
         * and returns a dictionary object indicating the progress of the encoding.
         *
         * This is potentially more performant than the older encode() method.
         *
         * @param source Text to encode.
         * @param destination Buffer where to place the resulting UTF-8 encoded text into.
         */
        encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult
    }

    const console: Console

    const TextDecoder: {
        prototype: TextDecoder
        new (label?: TextDecoderEncoding, options?: TextDecoderOptions): TextDecoder
    }

    const TextEncoder: {
        prototype: TextEncoder
        new (): TextEncoder
    }
}

export {}

