/**
 * regexp.js
 */

/**
 * Matches and captures the charset parameter in a media type string.
 * @type {RegExp}
 */
export const REG_CHARSET = /^charset=([\w#&.;-]+)$/;

/**
 * Matches a trailing empty fragment identifier (#).
 * @type {RegExp}
 */
export const REG_HASH = /(?:#|%23)$/;

/**
 * Matches URL-encoded or raw numeric character references (hexadecimal or decimal).
 * @type {RegExp}
 */
export const REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/gi;

/**
 * Matches MIME types that contain DOM-parsable content (HTML, XML, SVG).
 * @type {RegExp}
 */
export const REG_MIME_DOM =
  /^(?:application\/(?:[\w#&.;-]+\+)?x|image\/svg\+x|text\/(?:ht|x))ml;?/;

/**
 * Matches general text MIME types.
 * @type {RegExp}
 */
export const REG_MIME_TEXT = /^text\/[\w#&.;-]+/;

/**
 * Matches a trailing empty query string (?), ensuring it is not part of a hash.
 * @type {RegExp}
 */
export const REG_QUERY = /(?<!(?:#|%23).*)(?:\?|%3F)$/;

/**
 * Validates whether a string complies with the standard IANA URI scheme syntax rules.
 * @type {RegExp}
 */
export const REG_SCHEME = /^[a-z][\da-z+.-]*$/;

/**
 * Matches application-specific custom extensions or web custom schemes (ext+ or web+).
 * @type {RegExp}
 */
export const REG_SCHEME_EXT = /^(?:ext|web)\+[a-z]+$/;

/**
 * Matches executable script schemes (javascript or vbscript), case-insensitive.
 * @type {RegExp}
 */
export const REG_SCRIPT = /^(?:java|vb)script$/i;

/**
 * Matches script-executing or data-fetching schemes (javascript, vbscript, or blob).
 * @type {RegExp}
 */
export const REG_SCRIPT_BLOB = /^(?:(?:java|vb)script|blob)$/i;

/**
 * Matches HTML tags, quotes, or their percent-encoded and character reference variants.
 * @type {RegExp}
 */
export const REG_TAG_QUOT =
  /["'<>]|%(?:22|27|3C|3E)|&(?:apos|lt|gt|quot|#0*(?:34|39|60|62)|#x0*(?:22|27|3C|3E));/i;

/**
 * Matches a valid percent-encoded character format (%XX).
 * @type {RegExp}
 */
export const REG_URL_ENC = /^%[\dA-F]{2}$/i;

/**
 * Validates relative URLs and flags invalid patterns (e.g., duplicate slashes, backslashes, or incomplete schemes).
 * @type {RegExp}
 */
export const REG_VERIFY_RELATIVE = /^(?:\/{2,}|\\|[a-z][a-z\d+\-.]*:[^/])/i;
