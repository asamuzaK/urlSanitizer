export declare class SanitizeContext {
    #private;
    domPurify: object;
    nest: number;
    recurse: Set<any>;
    restrictScheme: boolean;
    schemeMap: Map<string, boolean>;
    allowRelative: boolean | undefined;
    debug: boolean | undefined;
    schemes: Set<any> | undefined;
    constructor(opt: object, domPurifyInstance: object);
    private #compileRules;
    private #registerScheme;
    enter(url: string): boolean;
    leave(url: string): void;
}
export declare class SanitizeFilter {
    #private;
    constructor(options: object);
    private #process;
    private #sanitizeDataURL;
    private #purify;
    private #handleSanitizeAttribute;
    private #sanitizeStandardURL;
    sanitize(url: string, options?: object): string | null;
    sanitizeBuffer(buffer: ArrayBuffer, mimeType: string, options?: object): Promise<string | null>;
    sanitizeDataURL(url: string, options?: object): Promise<string | null>;
}
