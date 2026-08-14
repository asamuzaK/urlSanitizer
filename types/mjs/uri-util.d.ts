export declare class URISchemes {
    #private;
    get(): string[];
    getScheme(uri: string): string | null;
    has(scheme: string): boolean;
    normalize(uri: string, isScheme?: boolean): string | null;
    parse(uri: string, base?: string): URL | null;
    verify(uri: string, schemes?: Set<string>): boolean;
    verifyParsed(parsedUrl: URL, schemes?: Set<string>, allowCustom?: boolean): boolean;
}
export declare const getSchemeParts: (protocol: string) => string[];
export declare const getURLEncodedString: (str: string) => string;
export declare const escapeURLEncodedHTMLChars: (ch: string) => string;
export declare const truncateURL: (url: string | unknown) => string;
export declare const trimTrailingEmptyQueryAndHash: (url: string) => string;
export declare const replaceNumCharRef: (match: string, value: string) => string;
export declare const parseURLEncodedNumCharRef: (str: string, nest?: number) => string;
export declare const extractDataUrlComponents: (pathname: string, search?: string, hash?: string) => object;
export declare const parseBase64: (data: string) => string;
