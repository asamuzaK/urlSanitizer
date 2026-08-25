/**
 * scheme.js
 */

/* shared */
import uriSchemes from '../lib/iana/uri-schemes.json' with { type: 'json' };
import { isString } from './common.js';
import { normalizeURL, parseURL } from './utility.js';

/* constants */
import { REG_SCHEME_EXT, REG_SCRIPT } from './regexp.js';

/**
 * URI schemes
 */
export class URISchemes {
  /* private fields */
  #schemes = new Set(uriSchemes);

  /**
   * Gets the list of registered URI schemes.
   * @see {@link https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml}
   * - Historical schemes are omitted.
   * - The 'moz-extension' scheme is added by default.
   * @returns {string[]} An array of registered schemes.
   */
  get() {
    return [...this.#schemes];
  }

  /**
   * Extracts the scheme from URI.
   * @param {string} uri - The URI string.
   * @returns {string|null} The extracted scheme, or null.
   */
  getScheme(uri) {
    if (!isString(uri)) {
      return null;
    }
    const parsed = this.parse(uri);
    if (parsed) {
      return this.normalize(parsed.protocol, true);
    }
    return null;
  }

  /**
   * Checks if the specified scheme is currently registered.
   * @param {string} scheme - The target scheme.
   * @returns {boolean} True if the scheme is registered.
   */
  has(scheme) {
    const normalized = this.normalize(scheme, true);
    if (normalized) {
      return this.#schemes.has(normalized);
    }
    return false;
  }

  /**
   * Normalizes the URI string using NFKC.
   * @param {string} uri - The URI string to normalize.
   * @param {boolean} [isScheme] - True if the URI is a scheme.
   * @returns {string|null} The normalized URI string, or null.
   */
  normalize(uri, isScheme = false) {
    return normalizeURL(uri, isScheme);
  }

  /**
   * Normalizes an array of scheme strings.
   * Filters out non-string items and trims/lowercases valid schemes.
   * @param {string[]} schemes - An array of scheme strings to normalize.
   * @returns {string[]} An array of normalized scheme strings, or an empty array if invalid.
   */
  normalizeSchemes(schemes) {
    if (Array.isArray(schemes)) {
      const normalizedSchemes = [];
      for (const scheme of schemes) {
        const normalized = normalizeURL(scheme, true);
        if (normalized) {
          normalizedSchemes.push(normalized);
        }
      }
      return normalizedSchemes;
    }
    return [];
  }

  /**
   * Parses the URI/URL string.
   * @param {string} uri - The URI/URL string.
   * @param {string} [base] - The base URL string.
   * @param {boolean} [normalize] - Indicates whether to normalize the URI.
   * @returns {URL|null} The parsed URL object, or null.
   */
  parse(uri, base, normalize = false) {
    return parseURL(uri, base, normalize);
  }

  /**
   * Verifies if the given URI is valid and its scheme is allowed.
   * @param {string} uri - The URI string to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the URI is valid and permitted.
   */
  verifyURI(uri, schemes) {
    if (!isString(uri)) {
      return false;
    }
    const parsedUrl = this.parse(uri);
    if (!parsedUrl) {
      return false;
    }
    return this.verifyScheme(parsedUrl.protocol, schemes, true);
  }

  /**
   * Verifies if the scheme is valid and allowed.
   * @param {string} scheme - A scheme or URL.protocol to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @param {boolean} [allowCustom] - True if web+*, ext+* schemes are allowed.
   * @returns {boolean} True if the parsed URL is valid and permitted.
   */
  verifyScheme(scheme, schemes, allowCustom = false) {
    const normalized = this.normalize(scheme, true);
    if (!normalized) {
      return false;
    }
    const targetSchemes = schemes || this.#schemes;
    if (!normalized.includes('+')) {
      if (REG_SCRIPT.test(normalized)) {
        return false;
      }
      return targetSchemes.has(normalized);
    }
    const parts = normalized.split('+');
    const isScript = parts.some(s => REG_SCRIPT.test(s));
    if (isScript) {
      return false;
    }
    if (targetSchemes.has(normalized)) {
      return true;
    }
    return (
      (allowCustom && REG_SCHEME_EXT.test(normalized)) ||
      parts.every(s => targetSchemes.has(s))
    );
  }
}
