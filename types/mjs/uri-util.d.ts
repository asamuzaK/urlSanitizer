export class URISchemes {
    get(): string[];
    has(scheme: string): boolean;
    verify(uri: string, schemes?: Set<string>): boolean;
    #private;
}
export function getURLEncodedString(str: string): string;
export function escapeURLEncodedHTMLChars(ch: string): string;
export function parseBase64(data: string): string;
export function replaceNumCharRef(match: string, value: string): string;
export function trimTrailingEmptyQueryAndHash(url: string): string;
export function parseURLEncodedNumCharRef(str: string, nest?: number): string;
export function convertBlobToDataURL(blob: Blob, maxSize?: number): Promise<string | null>;
