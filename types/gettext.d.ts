export namespace Gettext {
    export enum LocaleCategory {
        CTYPE = 0,
        NUMERIC = 1,
        TIME = 2,
        COLLATE = 3,
        MONETARY = 4,
        MESSAGES = 5,
        ALL = 6,
    }

    export function setlocale(category: LocaleCategory, locale: string | null): string | null;
    export function textdomain(domainName: string): void;
    export function bindtextdomain(domainName: string, dirName: string): void;

    export function gettext(msgid: string): string;
    export function dgettext(domainName: string | null, msgid: string): string;
    export function dcgettext(domainName: string | null, msgid: string, category: LocaleCategory): string;

    export function ngettext(msgid1: string, msgid2: string, n: number): string;
    export function dngettext(domainName: string | null, msgid1: string, msgid2: string, n: number): string;

    export function pgettext(context: string | null, msgid: string): string;
    export function dpgettext(domainName: string | null, context: string | null, msgid: string): string;

    export class GettextObject {
        gettext(msgid: string): string;
        ngettext(msgid1: string, msgid2: string, n: number): string;
        pgettext(context: string | null, msgid: string): string;
    }

    export function domain(domainName: string | null): GettextObject;
}

export default Gettext;