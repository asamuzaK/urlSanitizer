export function logDebug(isDebug: boolean, message: string, error?: Error): void;
export function sanitizeURL(url: string, opt?: {
    allow?: string[] | undefined;
    deny?: string[] | undefined;
    only?: string[] | undefined;
    allowRelative?: boolean | undefined;
    debug?: boolean | undefined;
    revokeObjectURL?: boolean | undefined;
    maxBlobSize?: number | undefined;
    maxLength?: number | undefined;
}): Promise<string | null>;
export function sanitizeURLSync(url: string, opt?: {
    allow?: string[] | undefined;
    deny?: string[] | undefined;
    only?: string[] | undefined;
    allowRelative?: boolean | undefined;
    debug?: boolean | undefined;
    revokeObjectURL?: boolean | undefined;
    maxLength?: number | undefined;
}): string | null;
export function inspectURL(url: string): Promise<InspectedURLResult>;
export function parseURL(url: string): Promise<InspectedURLResult>;
export function inspectURLSync(url: string): InspectedURLResult;
export function parseURLSync(url: string): InspectedURLResult;
export function isURI(uri: string): Promise<boolean>;
export function isURISync(uri: string): boolean;
export default urlSanitizer;
export type InspectedDataURL = {
    mime: string;
    base64: boolean;
    data: string;
};
export type InspectedURLResult = {
    input: string;
    valid: boolean;
    reason?: string | undefined;
    data?: InspectedDataURL | null | undefined;
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
    static #currentInstance: URLSanitizer | null;
    static #currentCtx: null;
    private static #uponSanitizeAttribute;
    sanitize(url: string, opt?: {
        allow?: string[] | undefined;
        deny?: string[] | undefined;
        only?: string[] | undefined;
        allowRelative?: boolean | undefined;
        debug?: boolean | undefined;
        maxBlobSize?: number | undefined;
        maxLength?: number | undefined;
    }): string | null;
    inspect(url: string, opt?: object): InspectedURLResult;
    add(scheme: string): string[];
    remove(scheme: string): boolean;
    reset(): void;
    #private;
}
declare const urlSanitizer: URLSanitizer;
import { URISchemes } from './uri-util.js';
