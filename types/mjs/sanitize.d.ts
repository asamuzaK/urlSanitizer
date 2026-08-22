import { URISchemes } from './scheme.js';
export type InspectedDataURL = {
    base64: boolean;
    data: string;
    mime: string;
};
export type InspectedURLResult = {
    input: string;
    valid: boolean;
    href: string | null;
    relative?: boolean;
    reason?: string;
    data?: InspectedDataURL | null;
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
export declare class URLSanitizer extends URISchemes {
    #private;
    constructor();
    private #isValidScheme;
    private #normalizeOptions;
    private #inspect;
    get(): string[];
    has(scheme: string): boolean;
    add(scheme: string): string[];
    remove(scheme: string): boolean;
    reset(): void;
    sanitizeURL(url: string, opt?: {
        allow?: string[];
        deny?: string[];
        only?: string[];
        allowRelative?: boolean;
        debug?: boolean;
        revokeObjectURL?: boolean;
        maxBlobSize?: number;
        maxLength?: number;
    }): Promise<string | null>;
    sanitizeURLSync(url: string, opt?: {
        allow?: string[];
        deny?: string[];
        only?: string[];
        allowRelative?: boolean;
        debug?: boolean;
        revokeObjectURL?: boolean;
        maxLength?: number;
    }): string | null;
    inspectURL(url: string): Promise<InspectedURLResult>;
    isValidURI(uri: string): boolean;
}
