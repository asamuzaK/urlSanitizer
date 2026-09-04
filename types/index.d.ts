/*!
 * URL Sanitizer
 *
 * @license MIT
 * @copyright asamuzaK (Kazz)
 * @see {@link https://github.com/asamuzaK/urlSanitizer/blob/main/LICENSE}
 */
import { URLSanitizer } from './mjs/sanitize.js';
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
export type SanitizeOptions = {
    allow?: string[];
    deny?: string[];
    only?: string[];
    allowRelative?: boolean;
    debug?: boolean;
    revokeObjectURL?: boolean;
    maxBlobSize?: number;
    maxLength?: number;
};
export { URLSanitizer };
declare const sanitizer: URLSanitizer;
export declare const sanitizeURL: (url: string, opt?: SanitizeOptions) => Promise<string | null>;
export declare const sanitizeURLSync: (url: string, opt?: SanitizeOptions) => string | null;
export declare const inspectURL: (url: string) => Promise<InspectedURLResult>;
export declare const isValidURI: (uri: string) => boolean;
export declare const isURISync: (uri: string) => boolean;
export default sanitizer;
