/**
 * sanitize.js
 */

/* shared */
import { getType, logDebug, isString } from './common.js';
import { SanitizeFilter } from './filter.js';
import { URISchemes } from './scheme.js';
import {
  encodeBufferToBase64,
  extractDataURLComponents,
  fetchBlobAsArrayBuffer,
  normalizeURL,
  parseURL,
  truncateURL
} from './utility.js';

/* constants */
import { DEFAULT_OPTS } from './constant.js';
import { REG_SCHEME, REG_SCRIPT, REG_SCRIPT_OR_BLOB } from './regexp.js';
/* @type {string[]} */
const URL_PROPS = Object.freeze([
  'href',
  'origin',
  'protocol',
  'username',
  'password',
  'host',
  'hostname',
  'port',
  'pathname',
  'search',
  'hash'
]);

/* typedef */
/**
 * @typedef {import('../index.js').InspectedDataURL} InspectedDataURL
 * @typedef {import('../index.js').InspectedURLResult} InspectedURLResult
 * @typedef {import('../index.js').SanitizeOptions} SanitizeOptions
 */

/**
 * Internal sanitization options.
 * @typedef {SanitizeOptions & { schemes?: Set<string> }} InternalSanitizeOptions
 */

/**
 * URL sanitizer
 */
export class URLSanitizer extends URISchemes {
  /* private fields */
  #allowedSchemes;
  #defaultOpts;
  #filter;

  constructor() {
    super();
    this.#allowedSchemes = new Set(super.get());
    this.#defaultOpts = {
      ...DEFAULT_OPTS,
      schemes: this.#allowedSchemes
    };
    this.#filter = new SanitizeFilter(this.#defaultOpts);
  }

  /**
   * Validates if a normalized URI scheme is syntactically correct.
   * @private
   * @param {string} normalizedScheme - The normalized URI scheme to validate.
   * @returns {boolean} True if the scheme satisfies the syntax and requirements.
   */
  #isWellFormedScheme(normalizedScheme) {
    if (
      !isString(normalizedScheme) ||
      REG_SCRIPT_OR_BLOB.test(normalizedScheme)
    ) {
      return false;
    }
    if (normalizedScheme.includes('+')) {
      const isScript = normalizedScheme
        .split('+')
        .some(s => REG_SCRIPT.test(s));
      if (isScript) {
        return false;
      }
    }
    return REG_SCHEME.test(normalizedScheme);
  }

  /**
   * Normalizes options and evaluates preliminary scheme routing.
   * @private
   * @param {string} url - The URL string.
   * @param {SanitizeOptions} [opt] - The sanitization options.
   * @returns {{ isValid: boolean|undefined, options: InternalSanitizeOptions, scheme: string|null }} Normalized options, scheme, and isValid.
   */
  #normalizeOptions(url, opt = {}) {
    if (!isString(url) || url === '') {
      return { isValid: false };
    }
    const options = {
      ...this.#defaultOpts,
      ...opt,
      allow: this.normalizeSchemes(opt.allow),
      deny: this.normalizeSchemes(opt.deny),
      only: this.normalizeSchemes(opt.only),
      schemes: this.#allowedSchemes
    };
    const scheme = this.getScheme(url);
    if (scheme === null && !options.allowRelative) {
      return { isValid: false };
    }
    return { options, scheme };
  }

  /**
   * Inspects, parses, and sanitizes the given URL.
   * @private
   * @param {string} url - The URL string to parse.
   * @param {InternalSanitizeOptions} options - Sanitization options.
   * @returns {InspectedURLResult} The result of an inspected URL.
   */
  #inspect(url, options) {
    const inspectedURL = {
      input: url,
      href: null,
      valid: false
    };
    if (!isString(url)) {
      inspectedURL.reason = `Invalid URL input: ${truncateURL(url)}`;
      return inspectedURL;
    }
    if (url === '') {
      inspectedURL.reason = 'Invalid URL input: (empty string)';
      return inspectedURL;
    }
    let sanitizedURL;
    let invalidReason = null;
    try {
      sanitizedURL = this.#filter.sanitize(url, options);
      if (!sanitizedURL) {
        invalidReason =
          'Sanitization failed (blocked by allowed schemes or rules).';
      }
    } catch (e) {
      invalidReason = e.message;
    }
    if (sanitizedURL) {
      // Reparse the sanitized string to safely extract updated properties.
      const urlObj = parseURL(sanitizedURL);
      inspectedURL.valid = true;
      if (urlObj) {
        const scheme = normalizeURL(urlObj.protocol, true);
        if (scheme === 'data') {
          const { mediaTypes, data, isBase64 } = extractDataURLComponents(
            urlObj.pathname,
            urlObj.search,
            urlObj.hash
          );
          if (isBase64) {
            mediaTypes.pop();
          }
          inspectedURL.data = {
            mime: mediaTypes.join(';'),
            base64: isBase64,
            data
          };
        } else {
          inspectedURL.data = null;
        }
        for (const key of URL_PROPS) {
          const value = urlObj[key];
          if (isString(value)) {
            inspectedURL[key] = value;
          }
        }
      } else {
        // URL which is invalid as an absolute URL, but valid as a relative URL.
        inspectedURL.valid = false;
        inspectedURL.relative = true;
        inspectedURL.href = sanitizedURL;
        inspectedURL.reason =
          'Invalid as an absolute URL, but valid as a relative URL.';
      }
    } else {
      inspectedURL.reason = invalidReason;
    }
    return inspectedURL;
  }

  /**
   * Inspects a blob URL by reading its buffer and converting it.
   * @private
   * @param {string} url - The blob URL.
   * @param {InternalSanitizeOptions} options - Sanitization options.
   * @returns {Promise<InspectedURLResult>} A promise resolving to the inspected URL result.
   */
  async #inspectBlob(url, options) {
    try {
      const { buffer, mimeType } = await fetchBlobAsArrayBuffer(
        url,
        options.maxBlobSize,
        options.signal
      );
      const base64Data = encodeBufferToBase64(buffer);
      const dataURL = `data:${mimeType ? `${mimeType};base64` : 'base64'},${base64Data}`;
      const result = this.#inspect(dataURL, options);
      result.input = url;
      return result;
    } catch (e) {
      if (e.name === 'AbortError' || options.signal?.aborted) {
        throw e;
      }
      if (options.debug) {
        logDebug(`Failed to inspect blob URL: ${truncateURL(url)}`, e);
      }
      return { input: url, valid: false, reason: e.message };
    } finally {
      if (options.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
    }
  }

  /**
   * Re-throws errors or operation aborts.
   * @private
   * @param {Error} e - The error object to evaluate.
   * @param {InternalSanitizeOptions} options - The internal sanitization options.
   * @throws {Error} Re-throws the given error if it is a TypeError, AbortError, or aborted signal.
   */
  #shouldThrow(e, options) {
    if (
      e instanceof TypeError ||
      e.name === 'AbortError' ||
      options.signal?.aborted
    ) {
      throw e;
    }
  }

  /**
   * Gets the list of registered URI schemes.
   * @returns {string[]} An array of registered schemes.
   */
  get() {
    return [...this.#allowedSchemes];
  }

  /**
   * Checks if the specified scheme is currently registered.
   * @param {string} scheme - The target scheme.
   * @returns {boolean} True if the scheme is registered.
   */
  has(scheme) {
    const normalizedScheme = normalizeURL(scheme, true);
    if (normalizedScheme) {
      return this.#allowedSchemes.has(normalizedScheme);
    }
    return false;
  }

  /**
   * Adds a new scheme to the allowed list.
   * @param {string} scheme - The scheme to add.
   * @returns {string[]} The updated array of registered schemes.
   */
  add(scheme) {
    if (!isString(scheme)) {
      throw new TypeError(`Expected String but got ${getType(scheme)}.`);
    }
    const normalizedScheme = normalizeURL(scheme, true);
    if (!this.#isWellFormedScheme(normalizedScheme)) {
      throw new Error(`Invalid scheme: ${scheme}`);
    }
    this.#allowedSchemes.add(normalizedScheme);
    return [...this.#allowedSchemes];
  }

  /**
   * Removes a scheme from the allowed list.
   * @param {string} scheme - The scheme to remove.
   * @returns {boolean} True if the scheme was successfully removed.
   */
  remove(scheme) {
    if (!isString(scheme)) {
      return false;
    }
    const normalizedScheme = normalizeURL(scheme, true);
    return this.#allowedSchemes.delete(normalizedScheme);
  }

  /**
   * Resets the registered schemes back to the default initial list.
   * @returns {void}
   */
  reset() {
    this.#allowedSchemes.clear();
    for (const scheme of super.get()) {
      this.#allowedSchemes.add(scheme);
    }
  }

  /**
   * Asynchronously sanitizes the given URL.
   * NOTE: `blob`, `data`, and `file` schemes must be explicitly allowed.
   * Given a `blob` URL, it securely converts and returns a sanitized `data` URL.
   * @param {string} url - URL
   * @param {SanitizeOptions} [opt] - The sanitization options.
   * @returns {Promise<string|null>} A promise resolving to the sanitized URL, or null.
   */
  async sanitizeURL(url, opt) {
    const { isValid, options, scheme } = this.#normalizeOptions(url, opt);
    if (isValid === false) {
      return null;
    }
    if (scheme === 'blob') {
      const { allow, deny, only } = options;
      let sanitizedData = null;
      try {
        if (
          (allow.includes('blob') && !deny.includes('blob')) ||
          only.includes('blob')
        ) {
          let fetchedBuffer = null;
          let fetchedMimeType = '';
          try {
            const fetchResult = await fetchBlobAsArrayBuffer(
              url,
              options.maxBlobSize,
              options.signal
            );
            fetchedBuffer = fetchResult.buffer;
            fetchedMimeType = fetchResult.mimeType;
          } catch (e) {
            if (e.name === 'AbortError' || options.signal?.aborted) {
              throw e;
            }
            if (options.debug) {
              logDebug(
                `Failed to fetch and convert blob URL: ${truncateURL(url)}`,
                e
              );
            }
          }
          if (fetchedBuffer) {
            if (only.length) {
              if (!only.includes('data')) {
                options.only = [...only, 'data'];
              }
            } else {
              if (!allow.includes('data')) {
                options.allow = [...allow, 'data'];
              }
              options.deny = deny.filter(s => s !== 'data');
            }
            sanitizedData = await this.#filter.sanitizeBuffer(
              fetchedBuffer,
              fetchedMimeType,
              options
            );
          }
        }
      } catch (e) {
        this.#shouldThrow(e, options);
        if (options.debug) {
          logDebug(`Failed to sanitize URL: ${truncateURL(url)}`, e);
        }
        return null;
      } finally {
        if (options.revokeObjectURL) {
          URL.revokeObjectURL(url);
        }
      }
      return sanitizedData;
    }
    try {
      if (scheme === 'data') {
        return this.#filter.sanitizeDataURL(url, options);
      }
      return this.#filter.sanitize(url, options);
    } catch (e) {
      this.#shouldThrow(e, options);
      if (options.debug) {
        logDebug(`Failed to sanitize URL: ${truncateURL(url)}`, e);
      }
      return null;
    }
  }

  /**
   * Synchronously sanitizes the given URL.
   * NOTE: `data` and `file` schemes must be explicitly allowed.
   * The `blob` scheme is not supported and will return `null`.
   * @param {string} url - URL.
   * @param {SanitizeOptions} [opt] - The sanitization options.
   * @returns {string|null} The sanitized URL, or null if denied.
   */
  sanitizeURLSync(url, opt) {
    const { isValid, options, scheme } = this.#normalizeOptions(url, opt);
    if (isValid === false) {
      return null;
    }
    if (scheme === 'blob') {
      if (options.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
      return null;
    }
    try {
      return this.#filter.sanitize(url, options);
    } catch (e) {
      this.#shouldThrow(e, options);
      if (options.debug) {
        logDebug(`Failed to sanitize URL: ${truncateURL(url)}`, e);
      }
      return null;
    }
  }

  /**
   * Sanitizes the given URL and returns its parsed components.
   * @param {string} url - The URL string to inspect.
   * @param {SanitizeOptions} [opt] - The sanitization options.
   * @returns {Promise<InspectedURLResult>} A promise resolving to the inspected URL result.
   */
  async inspectURL(url, opt = {}) {
    const { options, scheme } = this.#normalizeOptions(url, opt);
    if (scheme === 'blob') {
      return this.#inspectBlob(url, options);
    }
    return this.#inspect(url, options);
  }

  /**
   * Verifies if the given URI is valid and its scheme is allowed.
   * @param {string} uri - The URI string to verify.
   * @returns {boolean} True if the URI is syntactically valid and permitted.
   */
  isValidURI(uri) {
    return super.verifyURI(uri, this.#allowedSchemes);
  }
}
