export type DOMPurify = import('dompurify').DOMPurify;
export type InspectedDataURL = import('../index.js').InspectedDataURL;
export type InspectedURLResult = import('../index.js').InspectedURLResult;
export type SanitizeOptions = import('../index.js').SanitizeOptions;
export type InternalSanitizeOptions = import('./sanitize.js').InternalSanitizeOptions;
export declare class SanitizeContext {
    #private;
    domPurify: import("dompurify").DOMPurify;
    nest: number;
    recurse: Set<any>;
    restrictScheme: boolean;
    schemeMap: Map<string, boolean>;
    allowRelative: boolean | undefined;
    debug: boolean | undefined;
    constructor(domPurifyInstance: DOMPurify, opt?: InternalSanitizeOptions);
    private #compileRules;
    private #registerScheme;
    enter(url: string): boolean;
    leave(url: string): void;
}
export declare class SanitizeFilter {
    #private;
    constructor(opt?: InternalSanitizeOptions);
    private #process;
    private #sanitizeDataURL;
    private #purify;
    private #handleSanitizeAttribute;
    private #sanitizeStandardURL;
    sanitize(url: string, opt?: InternalSanitizeOptions): string | null;
    sanitizeBuffer(buffer: ArrayBuffer, mimeType: string, opt?: InternalSanitizeOptions): Promise<string | null>;
    sanitizeDataURL(url: string, opt?: InternalSanitizeOptions): Promise<string | null>;
}
