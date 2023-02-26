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
export function sanitizeURL(url: string, opt?: {
    allow?: Array<string>;
    deny?: Array<string>;
    only?: Array<string>;
    remove?: boolean;
}): Promise<string | null>;
export function sanitizeURLSync(url: string, opt?: {
    allow?: Array<string>;
    deny?: Array<string>;
    only?: Array<string>;
    remove?: boolean;
}): string | null;
export function parseURL(url: string): Promise<ParsedURL>;
export function parseURLSync(url: string): ParsedURL;
export function isURI(uri: string): Promise<boolean>;
export function isURISync(uri: string): boolean;
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
import { URISchemes } from "./uri-util.js";
declare const urlSanitizer: URLSanitizer;
