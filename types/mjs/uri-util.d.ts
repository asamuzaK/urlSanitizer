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
export class URLSanitizer extends URISchemes {
    replace(data: string): string;
    purify(dom: string): string;
    sanitize(url: string, opt?: {
        allow?: Array<string>;
        deny?: Array<string>;
        only?: Array<string>;
        remove?: boolean;
    }): string | null;
    parse(url: string, opt?: {
        allow?: Array<string>;
        deny?: Array<string>;
        only?: Array<string>;
        remove?: boolean;
    }): ParsedURL;
    #private;
}
export function isURISync(uri: string): boolean;
export function isURI(uri: string): Promise<boolean>;
export function parseURLSync(url: string): ParsedURL;
export function parseURL(url: string): Promise<ParsedURL>;
export function sanitizeURLSync(url: string, opt?: {
    allow?: Array<string>;
    deny?: Array<string>;
    only?: Array<string>;
    remove?: boolean;
}): string | null;
export function sanitizeURL(url: string, opt?: {
    allow?: Array<string>;
    deny?: Array<string>;
    only?: Array<string>;
    remove?: boolean;
}): Promise<string | null>;
export { urlSanitizer as default };
export type ParsedURL = {
    input: string;
    valid: boolean;
    data?: {
        mime?: string;
        base64?: boolean;
        data?: string;
    };
    href?: string;
    origin?: string;
    protocol?: string;
    username?: string;
    password?: string;
    host?: string;
    hostname?: string;
    port?: string;
    pathname?: string;
    search?: string;
    hash?: string;
};
declare const urlSanitizer: URLSanitizer;
