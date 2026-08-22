export declare class SanitizeContext {
    debug: boolean;
    schemes: any;
    domPurify: object;
    nest: number;
    recurse: Set<any>;
    schemeMap: Map<string, boolean>;
    constructor(opt: object, domPurifyInstance: object);
    enter(url: string): boolean;
    leave(url: string): void;
}
export declare class SanitizeFilter {
    #private;
    private #process;
    private #resolveSchemeRules;
    private #registerScheme;
    private #isValidScheme;
    private #parseAndVerifyURL;
    private #isSchemeAllowed;
    private #sanitizeDataURL;
    private #purify;
    private #handleSanitizeAttribute;
    private #sanitizeStandardURL;
    sanitize(url: string, schemes?: Set<string>, opt?: {
        allow?: string[];
        deny?: string[];
        only?: string[];
        allowRelative?: boolean;
        debug?: boolean;
        maxLength?: number;
    }): string | null;
    sanitizeBuffer(buffer: ArrayBuffer, mimeType: string, schemes?: Set<string>, opt?: object): Promise<string | null>;
    sanitizeDataURL(url: string, schemes?: Set<string>, opt?: object): Promise<string | null>;
}
