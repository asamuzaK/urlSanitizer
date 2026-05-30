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
export function parseURLEncodedNumCharRef(str: string, nest?: number): string;
export function createDataURLFromBlob(blob: Blob, maxBlobSize?: number): Promise<string | null>;
export function trimTrailingEmptyQueryAndHash(url: string): string;
