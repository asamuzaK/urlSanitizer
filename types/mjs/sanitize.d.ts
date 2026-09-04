import { URISchemes } from './scheme.js';
export type InspectedDataURL = import('../index.js').InspectedDataURL;
export type InspectedURLResult = import('../index.js').InspectedURLResult;
export type SanitizeOptions = import('../index.js').SanitizeOptions;
export type InternalSanitizeOptions = SanitizeOptions & {
    schemes?: Set<string>;
};
export declare class URLSanitizer extends URISchemes {
    #private;
    constructor();
    private #isWellFormedScheme;
    private #normalizeOptions;
    private #inspect;
    get(): string[];
    has(scheme: string): boolean;
    add(scheme: string): string[];
    remove(scheme: string): boolean;
    reset(): void;
    sanitizeURL(url: string, opt?: SanitizeOptions): Promise<string | null>;
    sanitizeURLSync(url: string, opt?: SanitizeOptions): string | null;
    inspectURL(url: string): Promise<InspectedURLResult>;
    isValidURI(uri: string): boolean;
}
