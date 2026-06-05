/**
 * regexp.js
 */

/**
 * Matches and captures the charset parameter in a media type string.
 * @type {RegExp}
 */
export const REG_CHARSET = /^charset\s*=\s*(["']?)(?<name>[\w:-]+)\1$/;

/**
 * Matches a trailing empty fragment identifier (#).
 * @type {RegExp}
 */
export const REG_HASH = /(?:#|%23)$/;

/**
 * Matches MIME types that contain DOM-parsable content (HTML, XML, SVG).
 * @type {RegExp}
 */
export const REG_MIME_DOM = /^(?:application\/(?:[\w.-]+\+)?xml|image\/svg\+xml|text\/(?:html|xml))(?:\s*;\s*|$)/i;

/**
 * Matches general text MIME types.
 * @type {RegExp}
 */
export const REG_MIME_TEXT = /^text\/[\w#&.;-]+/;

/**
 * Matches numeric character reference.
 * @type {RegExp}
 */
export const REG_NUM_REF = /&#(x0*[\dA-F]{1,2}|0*\d{1,3});?/gi;

/**
 * Matches a trailing empty query string (?), ensuring it is not part of a hash.
 * @type {RegExp}
 */
export const REG_QUERY = /(?<!(?:#|%23).*)(?:\?|%3F)$/;

/**
 * Validates a string against standard IANA URI scheme syntax.
 * @type {RegExp}
 */
export const REG_SCHEME = /^[a-z][\da-z+.-]*$/;

/**
 * Matches web custom schemes (`web+`) or application-specific schemes (`ext+`).
 * - `web+` schemes comply with the HTML Standard.
 * - `ext+` schemes comply with RFC 3986 but disallow `+` in the suffix.
 * @type {RegExp}
 */
export const REG_SCHEME_EXT = /^(?:web\+[a-z]+|ext\+[a-z][\da-z.-]*)$/;

/**
 * Matches executable script schemes (javascript or vbscript).
 * @type {RegExp}
 */
export const REG_SCRIPT = /^(?:java|vb)script$/i;

/**
 * Matches script-executing or data-fetching schemes.
 * @type {RegExp}
 */
export const REG_SCRIPT_BLOB = /^(?:(?:java|vb)script|blob)$/i;

/**
 * Matches HTML tags, quotes, and their encoded or character reference variants.
 * @type {RegExp}
 */
export const REG_TAG_QUOT =
  /["'<>]|%(?:22|27|3C|3E)|&(?:apos|lt|gt|quot|#0*(?:34|39|60|62)|#x0*(?:22|27|3C|3E));/i;

/**
 * Matches a percent-encoded character (%XX).
 * @type {RegExp}
 */
export const REG_URL_ENC = /^%[\dA-F]{2}$/i;

/**
 * Matches an ampersand-encoded character (&foo).
 */
export const REG_AMP_ENC = /&(?=[#a-z0-9])(?![a-z0-9]+=)/i;

/**
 * Validates relative URLs and flags invalid patterns.
 * @type {RegExp}
 */
export const REG_VERIFY_RELATIVE = /^(?:\/{2,}|\\|[a-z][a-z\d+\-.]*:[^/])/i;
