import { URISchemes } from './uri-util.js';
export type InspectedDataURL = {
    mime: string;
    base64: boolean;
    data: string;
};
export type InspectedURLResult = {
    input: string;
    valid: boolean;
    reason?: string;
    data?: InspectedDataURL | null;
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
export declare const logDebug: (message: string, error?: Error) => void;
export declare class SanitizeContext {
    debug: boolean;
    domPurify: object;
    nest: number;
    recurse: Set<any>;
    schemeMap: Map<string, boolean>;
    constructor(opt: object, domPurifyInstance: object);
    enter(url: string): boolean;
    leave(url: string): void;
}
export declare class URLSanitizer extends URISchemes {
    #private;
    private static #uponSanitizeAttribute;
    constructor();
    private #registerScheme;
    private #purify;
    private #process;
    private #resolveSchemeRules;
    private #parseAndVerifyURL;
    private #isSchemeAllowed;
    private #sanitizeDataURL;
    private #sanitizeStandardURL;
    private #executeSanitize;
    sanitize(url: string, opt?: {
        allow?: string[];
        deny?: string[];
        only?: string[];
        allowRelative?: boolean;
        debug?: boolean;
        maxBlobSize?: number;
        maxLength?: number;
    }): string | null;
    inspect(url: string): InspectedURLResult;
    get(): string[];
    has(scheme: string): boolean;
    add(scheme: string): string[];
    remove(scheme: string): boolean;
    reset(): void;
    verify(uri: string, schemes?: Set<string>): boolean;
}
declare const urlSanitizer: URLSanitizer;
export declare const sanitizeURL: (url: string, opt?: {
    allow?: string[];
    deny?: string[];
    only?: string[];
    allowRelative?: boolean;
    debug?: boolean;
    revokeObjectURL?: boolean;
    maxBlobSize?: number;
    maxLength?: number;
}) => Promise<string | null>;
export declare const sanitizeURLSync: (url: string, opt?: {
    allow?: string[];
    deny?: string[];
    only?: string[];
    allowRelative?: boolean;
    debug?: boolean;
    revokeObjectURL?: boolean;
    maxLength?: number;
}) => string | null;
export declare const inspectURL: (url: string) => Promise<InspectedURLResult>;
export declare const isValidURI: (uri: string) => boolean;
export declare const isURISync: (uri: string) => boolean;
export default urlSanitizer;
