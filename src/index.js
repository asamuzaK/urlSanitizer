/*!
 * URL Sanitizer
 *
 * @license MIT
 * @copyright asamuzaK (Kazz)
 * @see {@link https://github.com/asamuzaK/urlSanitizer/blob/main/LICENSE}
 */

import { URLSanitizer } from './mjs/sanitize.js';

/* typedef */
/**
 * The parsed result of a Data URL.
 * @typedef {object} InspectedDataURL
 * @property {boolean} base64 - Indicates whether the data is base64-encoded.
 * @property {string} data - The actual data part of the Data URL.
 * @property {string} mime - The MIME type of the data.
 */

/**
 * The result of an inspected URL, extending the standard URL API.
 * The properties except for input and valid are omitted for invalid URLs.
 * @typedef {object} InspectedURLResult
 * @property {string} input - The original URL input.
 * @property {boolean} valid - Indicates whether the sanitized URL (href) is a valid absolute URL.
 * @property {string|null} href - The sanitized URL, or null.
 * @property {boolean} [relative] - Indicates whether the sanitized URL (href) is a valid relative URL.
 * @property {string} [reason] - The reason why the URL is invalid.
 * @property {InspectedDataURL|null} [data] - The parsed result of a Data URL, or null.
 * @property {string} [origin] - The scheme, domain, and port.
 * @property {string} [protocol] - The protocol scheme.
 * @property {string} [username] - The specified username.
 * @property {string} [password] - The specified password.
 * @property {string} [host] - The domain and port.
 * @property {string} [hostname] - The domain.
 * @property {string} [port] - The port number.
 * @property {string} [pathname] - The path.
 * @property {string} [search] - The query string.
 * @property {string} [hash] - The fragment identifier.
 */

/**
 * The sanitization options.
 * @typedef {object} SanitizeOptions
 * @property {string[]} [allow] - The array of schemes to allow.
 * @property {string[]} [deny] - The array of schemes to deny. Takes precedence over `allow`.
 * @property {string[]} [only] - The array of specific schemes to allow. Takes precedence over `allow` and `deny`.
 * @property {boolean} [allowRelative] - Allow relative URLs.
 * @property {boolean} [debug] - Enable debug mode.
 * @property {boolean} [revokeObjectURL] - Revokes the Blob URL after sanitization.
 * @property {number} [maxBlobSize] - The maximum allowed Blob size in bytes.
 * @property {number} [maxLength] - The maximum allowed URL length.
 */

export { URLSanitizer };

/* URLSanitizer instance */
const sanitizer = new URLSanitizer();

/* aliases */
/**
 * Asynchronously sanitizes the given URL.
 * NOTE: `blob`, `data`, and `file` schemes must be explicitly allowed.
 * Given a `blob` URL, it securely converts and returns a sanitized `data` URL.
 * @param {string} url - URL.
 * @param {SanitizeOptions} [opt] - The sanitization options.
 * @returns {Promise<string|null>} A promise resolving to the sanitized URL, or null.
 */
export const sanitizeURL = async (url, opt) => sanitizer.sanitizeURL(url, opt);

/**
 * Synchronously sanitizes the given URL.
 * NOTE: `data` and `file` schemes must be explicitly allowed.
 * The `blob` scheme is not supported and will return `null`.
 * @param {string} url - URL.
 * @param {SanitizeOptions} [opt] - The sanitization options.
 * @returns {string|null} The sanitized URL, or null if denied.
 */
export const sanitizeURLSync = (url, opt) =>
  sanitizer.sanitizeURLSync(url, opt);

/**
 * Sanitizes the given URL and returns its parsed components.
 * NOTE: Blob URLs are not revoked after inspection.
 * @param {string} url - The URL string to inspect.
 * @returns {Promise<InspectedURLResult>} A promise resolving to the inspected URL result.
 */
export const inspectURL = async url => sanitizer.inspectURL(url);

/**
 * Checks if the given string is a valid URI and is registered.
 * @param {string} uri - The URI string to verify.
 * @returns {boolean} True if valid and registered, false otherwise.
 */
export const isValidURI = uri => sanitizer.isValidURI(uri);

/**
 * @deprecated Use {@link isValidURI} instead.
 * @param {string} uri - The URI string to verify.
 * @returns {boolean} True if valid and registered, false otherwise.
 */
export const isURISync = uri => sanitizer.isValidURI(uri);

/* export instance */
export default sanitizer;
