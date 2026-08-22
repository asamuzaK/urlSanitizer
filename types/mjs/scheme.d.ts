export declare class URISchemes {
    #private;
    get(): string[];
    getScheme(uri: string): string | null;
    has(scheme: string): boolean;
    normalize(uri: string, isScheme?: boolean): string | null;
    normalizeSchemes(schemes: string[]): string[];
    parse(uri: string, base?: string, normalize?: boolean): URL | null;
    verifyURI(uri: string, schemes?: Set<string>): boolean;
    verifyScheme(scheme: string, schemes?: Set<string>, allowCustom?: boolean): boolean;
}
