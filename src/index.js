/*!
 * URL Sanitizer
 *
 * @license MIT
 * @copyright asamuzaK (Kazz)
 * @see {@link https://github.com/asamuzaK/urlSanitizer/blob/main/LICENSE}
 */

import { URLSanitizer } from './mjs/sanitize.js';

/**
 * @typedef {import('./mjs/sanitize.js').InspectedURLResult} InspectedURLResult
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
 * @param {object} [opt] - options.
 * @param {string[]} [opt.allow] - The array of schemes to allow.
 * @param {string[]} [opt.deny] - The array of schemes to deny.
 * @param {string[]} [opt.only] - The array of specific schemes to allow.
 * @param {boolean} [opt.allowRelative] - Allow relative URLs.
 * @param {boolean} [opt.debug] - Enable debug mode.
 * @param {boolean} [opt.revokeObjectURL] - Revokes the Blob URL after sanitization.
 * @param {number} [opt.maxBlobSize] - The maximum allowed Blob size in bytes.
 * @param {number} [opt.maxLength] - The maximum allowed URL length.
 * @returns {Promise<string|null>} A promise resolving to the sanitized URL, or null.
 */
export const sanitizeURL = async (url, opt) => sanitizer.sanitizeURL(url, opt);

/**
 * Synchronously sanitizes the given URL.
 * NOTE: `data` and `file` schemes must be explicitly allowed.
 * The `blob` scheme is not supported and will return `null`.
 * @param {string} url - URL.
 * @param {object} [opt] - options.
 * @param {string[]} [opt.allow] - The array of schemes to allow.
 * @param {string[]} [opt.deny] - The array of schemes to deny.
 * @param {string[]} [opt.only] - The array of specific schemes to allow.
 * @param {boolean} [opt.allowRelative] - Allow relative URLs.
 * @param {boolean} [opt.debug] - Enable debug mode.
 * @param {boolean} [opt.revokeObjectURL] - Revokes the Blob URL.
 * @param {number} [opt.maxLength] - The maximum allowed URL length.
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
