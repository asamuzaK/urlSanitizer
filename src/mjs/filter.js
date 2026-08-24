/**
 * filter.js
 */

/* shared */
import { logDebug, isString } from './common.js';
import { domPurify } from './dompurify.js';
import {
  encodeBufferToBase64,
  escapeURLEncodedHTMLChars,
  extractDataURLComponents,
  getSchemeParts,
  normalizeURL,
  parseBase64,
  parseURL,
  parseURLEncodedNumCharRef,
  trimTrailingEmptyQueryAndHash,
  truncateURL
} from './utility.js';

/* constants */
import { DUMMY_BASE, MAX_NEST } from './constant.js';
import {
  REG_AMP_ENC,
  REG_MIME_DOM,
  REG_SCHEME,
  REG_SCRIPT,
  REG_SCRIPT_OR_BLOB,
  REG_TAG_QUOT,
  REG_VERIFY_RELATIVE
} from './regexp.js';

/**
 * Context manager for the sanitization process.
 */
export class SanitizeContext {
  /**
   * @param {object} opt - Sanitization options.
   * @param {object} domPurifyInstance - The DOMPurify instance.
   */
  constructor(opt, domPurifyInstance) {
    this.domPurify = domPurifyInstance;
    this.nest = 0;
    this.recurse = new Set();
    this.restrictScheme = false;
    this.schemeMap = new Map([
      ['blob', false],
      ['data', false],
      ['file', false],
      ['javascript', false],
      ['vbscript', false]
    ]);
    this.#compileRules(opt);
  }

  /**
   * Compiles allow, deny, and only rules into the context.
   * @private
   * @param {object} opt - Sanitization options.
   */
  #compileRules(opt = {}) {
    const { allowRelative, debug, schemes, allow, deny, only } = opt;
    this.allowRelative = !!allowRelative;
    this.debug = !!debug;
    this.schemes = new Set(schemes || []);
    if (Array.isArray(only) && only.length) {
      this.schemes.clear();
      this.restrictScheme = true;
      for (const item of only) {
        if (isString(item)) this.#registerScheme(item);
      }
    } else {
      if (Array.isArray(allow) && allow.length) {
        for (const scheme of allow) {
          if (isString(scheme)) {
            this.#registerScheme(scheme);
          }
        }
      }
      if (Array.isArray(deny) && deny.length) {
        for (const scheme of deny) {
          if (isString(scheme)) {
            const normalized = normalizeURL(scheme, true);
            if (normalized) {
              this.schemeMap.set(normalized, false);
            }
          }
        }
      }
    }
  }

  /**
   * Register schemes for the 'allow' or 'only' options.
   * @private
   * @param {string} scheme - The scheme to register.
   * @returns {boolean} True if the scheme is successfully registered.
   */
  #registerScheme(scheme) {
    const normalizedScheme = normalizeURL(scheme, true);
    if (!this.#isValidScheme(normalizedScheme)) {
      return false;
    }
    this.schemeMap.set(normalizedScheme, true);
    this.schemes.add(normalizedScheme);
    return true;
  }

  /**
   * Validates if a normalized URI scheme is syntactically correct.
   * @private
   * @param {string} normalizedScheme - The normalized URI scheme to validate.
   * @returns {boolean} True if the scheme is valid.
   */
  #isValidScheme(normalizedScheme) {
    if (REG_SCRIPT_OR_BLOB.test(normalizedScheme)) {
      return false;
    }
    const schemeParts = normalizedScheme.split('+');
    const isScript = schemeParts.some(s => REG_SCRIPT.test(s));
    return !isScript && REG_SCHEME.test(normalizedScheme);
  }

  /**
   * Tracks the URL to prevent circular references.
   * @param {string} url - The URL being processed.
   * @returns {boolean} True if safe to proceed, false otherwise.
   */
  enter(url) {
    if (this.recurse.has(url)) {
      if (this.debug) {
        logDebug(`Circular Data URL detected and skipped: ${truncateURL(url)}`);
      }
      return false;
    }
    this.nest++;
    this.recurse.add(url);
    return true;
  }

  /**
   * Cleans up the tracking state after processing the URL.
   * @param {string} url - The URL that finished processing.
   */
  leave(url) {
    this.nest--;
    this.recurse.delete(url);
  }
}

/**
 * An executor for sanitization filters.
 */
export class SanitizeFilter {
  /* private fields */
  #defaultOpts;

  /**
   * @param {object} options - The default sanitization options.
   */
  constructor(options) {
    this.#defaultOpts = options;
  }

  /**
   * Process recursive method for sanitization.
   * @private
   * @param {string} url - The URL string to sanitize.
   * @param {SanitizeContext} ctx - The sanitization context.
   * @returns {string|null} The sanitized URL, or null.
   */
  #process(url, ctx) {
    if (ctx.nest > MAX_NEST) {
      throw new Error('Data URLs nested too deeply.');
    }
    // Parse and verify the URL
    const {
      isDataURL,
      isRelative,
      isVerified,
      scheme,
      schemeParts,
      urlObj,
      urlToSanitize
    } = this.#parseAndVerifyURL(url, ctx);
    if (!isVerified) {
      return null;
    }
    // Check if the scheme is allowed
    const isAllowed = this.#isSchemeAllowed(
      scheme,
      schemeParts,
      isRelative,
      ctx
    );
    if (!isAllowed) {
      return null;
    }
    if (isDataURL) {
      return this.#sanitizeDataURL(urlObj, scheme, ctx);
    }
    return this.#sanitizeStandardURL(urlToSanitize);
  }

  /**
   * Parses and verifies absolute and relative URLs.
   * @private
   * @param {string} url - The URL to parse.
   * @param {SanitizeContext} ctx - The sanitization context.
   * @returns {object} Parsed URL properties and flags.
   */
  #parseAndVerifyURL(url, ctx) {
    const urlObj = parseURL(url, null, true);
    let isVerified = ctx.schemes.has(normalizeURL(urlObj?.protocol, true));
    let isRelative = false;
    let relativePath = '';
    // Handle Relative URLs
    if (!isVerified && ctx.allowRelative && !REG_VERIFY_RELATIVE.test(url)) {
      const dummyURL = parseURL(url, DUMMY_BASE);
      if (dummyURL) {
        if (
          dummyURL.protocol === 'http:' &&
          dummyURL.hostname === 'dummy.local'
        ) {
          isVerified = true;
          isRelative = true;
          relativePath = `${dummyURL.pathname}${dummyURL.search}${dummyURL.hash}`;
        }
      }
    }
    if (!isVerified) {
      return { isVerified: false };
    }
    // Extract parts if verified
    if (isRelative) {
      return {
        isRelative,
        isVerified,
        isDataURL: false,
        scheme: '',
        schemeParts: [],
        urlToSanitize: relativePath
      };
    }
    const scheme = normalizeURL(urlObj.protocol, true);
    return {
      isRelative,
      isVerified,
      scheme,
      schemeParts: scheme.split('+'),
      urlObj,
      isDataURL: scheme === 'data',
      urlToSanitize: urlObj.href
    };
  }

  /**
   * Evaluates if the extracted scheme is permitted.
   * @private
   * @param {string} scheme - The normalized URL scheme.
   * @param {string[]} schemeParts - Parts of the split scheme.
   * @param {boolean} isRelative - If the URL is relative.
   * @param {SanitizeContext} ctx - The sanitization context.
   * @returns {boolean} True if the scheme is allowed.
   */
  #isSchemeAllowed(scheme, schemeParts, isRelative, ctx) {
    if (isRelative) {
      return true;
    }
    if (ctx.restrictScheme) {
      return ctx.schemeMap.has(scheme);
    }
    for (const [key, value] of ctx.schemeMap.entries()) {
      if (!value && (scheme === key || schemeParts.includes(key))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Decodes, verifies inner protocols, and purifies Data URLs.
   * @private
   * @param {object} urlObj - The URL object.
   * @param {string} scheme - The URL scheme.
   * @param {SanitizeContext} ctx - The sanitization context.
   * @returns {string|null} Sanitized Data URL or null.
   */
  #sanitizeDataURL(urlObj, scheme, ctx) {
    const { mediaType, mediaTypes, data, isBase64 } = extractDataURLComponents(
      urlObj.pathname,
      urlObj.search,
      urlObj.hash
    );
    let parsedData = data;
    if (isBase64) {
      try {
        parsedData = parseBase64(data);
      } catch (e) {
        if (ctx.debug) {
          logDebug('Failed to parse base64 data.', e);
        }
        return null;
      }
    }
    try {
      const decodedData = parseURLEncodedNumCharRef(parsedData).trim();
      const parsedURL = parseURL(decodedData, DUMMY_BASE);
      if (!parsedURL) {
        return null;
      }
      const dataSchemeParts = getSchemeParts(parsedURL.protocol);
      if (dataSchemeParts.some(s => REG_SCRIPT_OR_BLOB.test(s))) {
        return null;
      }
    } catch (e) {
      if (ctx.debug) {
        logDebug('Failed to parse inner data URL protocol.', e);
      }
      return null;
    }
    if (!mediaType || REG_MIME_DOM.test(mediaType)) {
      parsedData = this.#purify(parsedData, ctx);
    }
    if (parsedData) {
      if (isBase64 && parsedData !== data) {
        mediaTypes.pop();
      }
      return `${scheme}:${mediaTypes.join(';')},${parsedData}`;
    }
    return null;
  }

  /**
   * Purifies a URL-encoded DOM string to prevent XSS.
   * @private
   * @param {string} dom - The URL-encoded DOM string.
   * @param {SanitizeContext} ctx - The sanitization context.
   * @returns {string} The purified DOM string.
   */
  #purify(dom, ctx) {
    let decodedDom = dom;
    try {
      decodedDom = decodeURIComponent(dom);
    } catch {
      // fall through
    }
    let purifiedDom;
    const tempHook = (node, evt) =>
      this.#handleSanitizeAttribute(node, evt, ctx);
    ctx.domPurify.addHook('uponSanitizeAttribute', tempHook);
    try {
      purifiedDom = ctx.domPurify.sanitize(decodedDom);
    } finally {
      ctx.domPurify.removeHook('uponSanitizeAttribute');
    }
    purifiedDom = trimTrailingEmptyQueryAndHash(purifiedDom);
    try {
      return encodeURI(purifiedDom);
    } catch {
      return purifiedDom;
    }
  }

  /**
   * Internal handler for the DOMPurify hook.
   * @private
   * @param {Node} node - The DOM node.
   * @param {object} evt - The event object.
   * @param {SanitizeContext} ctx - The sanitization context.
   */
  #handleSanitizeAttribute(node, evt, ctx) {
    if (!evt.attrValue || !/^\s*data:/i.test(evt.attrValue)) {
      return;
    }
    const urlObj = parseURL(evt.attrValue, null, true);
    if (!urlObj || urlObj.protocol !== 'data:') {
      return;
    }
    const originalURL = evt.attrValue;
    if (!ctx.enter(originalURL)) {
      evt.attrValue = '';
      return;
    }
    try {
      const sanitized = this.#process(originalURL, ctx);
      evt.attrValue = sanitized || '';
    } finally {
      ctx.leave(originalURL);
    }
  }

  /**
   * Sanitizes URLs by stripping out problematic characters.
   * @private
   * @param {string} urlToSanitize - The absolute/relative URL.
   * @returns {string} The sanitized URL.
   */
  #sanitizeStandardURL(urlToSanitize) {
    const len = urlToSanitize.length;
    let truncateIndex = len;
    const matchTagQuot = REG_TAG_QUOT.exec(urlToSanitize);
    if (matchTagQuot) {
      truncateIndex = matchTagQuot.index;
    }
    if (urlToSanitize.indexOf('&') > -1) {
      const matchAmp = REG_AMP_ENC.exec(urlToSanitize);
      if (matchAmp) {
        const matchAmpIndex = matchAmp.index;
        if (matchAmpIndex < truncateIndex) {
          truncateIndex = matchAmpIndex;
        }
      }
    }
    if (truncateIndex === len) {
      return urlToSanitize;
    }
    const lastChar = urlToSanitize.charCodeAt(truncateIndex - 1);
    if (lastChar === 63 /* ? */ || lastChar === 38 /* & */) {
      truncateIndex--;
    }
    return urlToSanitize.substring(0, truncateIndex);
  }

  /**
   * Sanitizes the URL.
   * @param {string} url - The URL string to sanitize.
   * @param {object} options - Sanitization options.
   * @returns {string|null} The sanitized URL, or null.
   */
  sanitize(url, options = this.#defaultOpts) {
    if (!url || !isString(url)) {
      return null;
    }
    const { deny, maxLength, only, allowRelative } = options;
    if (Number.isInteger(maxLength) && url.length > maxLength) {
      const msg = `URL length ${url.length} exceeds max length ${maxLength}.`;
      throw new RangeError(msg);
    }
    const hasRestrictiveRules =
      (Array.isArray(deny) && deny.length > 0) ||
      (Array.isArray(only) && only.length > 0) ||
      allowRelative;
    // Early return for standard HTTP/HTTPS URLs without restrictive rules.
    if (
      !hasRestrictiveRules &&
      (url.startsWith('https://') || url.startsWith('http://')) &&
      !REG_TAG_QUOT.test(url) &&
      !url.includes('data:')
    ) {
      const urlObj = parseURL(url, null, true);
      if (urlObj && options.schemes.has(urlObj.protocol.replace(/:$/, ''))) {
        return urlObj.href.replace(/%26/g, escapeURLEncodedHTMLChars);
      }
      return null;
    }
    const ctx = new SanitizeContext(options, domPurify);
    return this.#process(url, ctx);
  }

  /**
   * Asynchronously sanitizes an ArrayBuffer and converts it to a Data URL.
   * @param {ArrayBuffer} buffer - The target buffer.
   * @param {string} mimeType - The MIME type of the buffer.
   * @param {object} options - Sanitization options.
   * @returns {Promise<string|null>} The sanitized Data URL, or null.
   */
  async sanitizeBuffer(buffer, mimeType, options = this.#defaultOpts) {
    if (!(buffer instanceof ArrayBuffer)) {
      return null;
    }
    const ctx = new SanitizeContext(options, domPurify);
    if (!ctx.schemeMap.get('data')) {
      return null;
    }
    const base64Data = await encodeBufferToBase64(buffer);
    const dataUrl = `data:${mimeType ? `${mimeType};base64` : 'base64'},${base64Data}`;
    if (
      Number.isInteger(options.maxLength) &&
      dataUrl.length > options.maxLength
    ) {
      throw new RangeError(
        `URL length ${dataUrl.length} exceeds max length ${options.maxLength}.`
      );
    }
    const urlObj = parseURL(dataUrl);
    if (!urlObj) {
      return null;
    }
    return this.#sanitizeDataURL(urlObj, 'data', ctx);
  }

  /**
   * Asynchronously sanitizes the Data URL.
   * @param {string} url - The URL string to sanitize.
   * @param {object} options - Sanitization options.
   * @returns {Promise<string|null>} The sanitized Data URL, or null.
   */
  async sanitizeDataURL(url, options = this.#defaultOpts) {
    if (!url || !isString(url)) {
      return null;
    }
    const { maxLength } = options;
    if (Number.isInteger(maxLength) && url.length > maxLength) {
      throw new RangeError(
        `URL length ${url.length} exceeds max length ${maxLength}.`
      );
    }
    const urlObj = parseURL(url);
    if (!urlObj) {
      return null;
    }
    const scheme = normalizeURL(urlObj.protocol, true);
    if (scheme !== 'data') {
      return null;
    }
    const ctx = new SanitizeContext(options, domPurify);
    if (!ctx.schemeMap.get(scheme)) {
      return null;
    }
    return this.#sanitizeDataURL(urlObj, scheme, ctx);
  }
}
