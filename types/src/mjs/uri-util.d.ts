export function getURLEncodedString(str: string): string;
export function escapeURLEncodedHTMLChars(ch: string): string;
export function parseBase64(data: string): string;
export function parseURLEncodedNumCharRef(str: string, nest?: number): string;
export function createDataURLFromBlob(blob: object): Promise<string | null>;
export class URISchemes {
    get(): Array<string>;
    has(scheme: string): boolean;
    add(scheme: string): Array<string>;
    remove(scheme: string): boolean;
    verify(uri: string): boolean;
    #private;
}
