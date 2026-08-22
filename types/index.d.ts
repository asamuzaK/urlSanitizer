/*!
 * URL Sanitizer
 *
 * @license MIT
 * @copyright asamuzaK (Kazz)
 * @see {@link https://github.com/asamuzaK/urlSanitizer/blob/main/LICENSE}
 */
import { URLSanitizer } from './mjs/sanitize.js';
export type InspectedURLResult = import('./mjs/sanitize.js').InspectedURLResult;
declare const sanitizer: URLSanitizer;
export declare const sanitizeURL: (url: string, opt?: {
    allow?: string[];
    deny?: string[];
    only?: string[];
    allowRelative?: boolean;
    debug?: boolean;
    revokeObjectURL?: boolean;
    maxBlobSize?: number;
    maxLength?: number;
}) => Promise<string | null>;
export declare const sanitizeURLSync: (url: string, opt?: {
    allow?: string[];
    deny?: string[];
    only?: string[];
    allowRelative?: boolean;
    debug?: boolean;
    revokeObjectURL?: boolean;
    maxLength?: number;
}) => string | null;
export declare const inspectURL: (url: string) => Promise<InspectedURLResult>;
export declare const isValidURI: (uri: string) => boolean;
export declare const isURISync: (uri: string) => boolean;
export default sanitizer;
