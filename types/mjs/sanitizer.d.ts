export function sanitizeURL(url: string, opt?: {
    allow?: string[] | undefined;
    deny?: string[] | undefined;
    only?: string[] | undefined;
}): Promise<string | null>;
export function sanitizeURLSync(url: string, opt?: {
    allow?: string[] | undefined;
    deny?: string[] | undefined;
    only?: string[] | undefined;
}): string | null;
export function parseURL(url: string): Promise<ParsedURL>;
export function parseURLSync(url: string): ParsedURL;
export function isURI(uri: string): Promise<boolean>;
export function isURISync(uri: string): boolean;
export default urlSanitizer;
export type ParsedURL = {
    input: string;
    valid: boolean;
    data?: {
        mime?: string | undefined;
        base64?: boolean | undefined;
        data?: string | undefined;
    } | undefined;
    href?: string | undefined;
    origin?: string | undefined;
    protocol?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    port?: string | undefined;
    pathname?: string | undefined;
    search?: string | undefined;
    hash?: string | undefined;
};
export class URLSanitizer extends URISchemes {
    replace(data: string): string;
    purify(dom: string): string;
    sanitize(url: string, opt?: {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
        only?: string[] | undefined;
    }): string | null;
    parse(url: string, opt?: {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
        only?: string[] | undefined;
    }): ParsedURL;
    #private;
}
declare const urlSanitizer: URLSanitizer;
import { URISchemes } from './uri-util.js';
