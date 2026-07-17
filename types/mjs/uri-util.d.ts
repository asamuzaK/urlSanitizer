export declare class URISchemes {
    #private;
    get(): string[];
    has(scheme: string): boolean;
    verify(uri: string, schemes?: Set<string>): boolean;
}
export declare const getURLEncodedString: (str: string) => string;
export declare const escapeURLEncodedHTMLChars: (ch: string) => string;
export declare const parseBase64: (data: string) => string;
export declare const replaceNumCharRef: (match: string, value: string) => string;
export declare const trimTrailingEmptyQueryAndHash: (url: string) => string;
export declare const parseURLEncodedNumCharRef: (str: string, nest?: number) => string;
export declare const convertBlobToDataURL: (blob: Blob, maxSize?: number) => Promise<string | null>;
