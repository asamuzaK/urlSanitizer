export type DataURLComponents = {
    data: string;
    isBase64: boolean;
    mediaType: string;
    mediaTypes: string[];
};
export declare const normalizeURL: (url: string, isScheme?: boolean) => string | null;
export declare const parseURL: (url: string, base?: string, normalize?: boolean) => URL | null;
export declare const getSchemeParts: (protocol: string) => string[];
export declare const getURLEncodedString: (str: string) => string;
export declare const escapeURLEncodedHTMLChars: (ch: string) => string;
export declare const truncateURL: (url: string | unknown) => string;
export declare const trimTrailingEmptyQueryAndHash: (url: string) => string;
export declare const replaceNumCharRef: (match: string, value: string) => string;
export declare const parseURLEncodedNumCharRef: (str: string, nest?: number) => string;
export declare const extractDataURLComponents: (pathname: string, search?: string, hash?: string) => DataURLComponents;
export declare const parseBase64: (data: string) => string;
export declare const encodeBufferToBase64: (buffer: ArrayBuffer) => string;
