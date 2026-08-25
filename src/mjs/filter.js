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
    if (Array.isArray(only) && only.length) {
      this.schemes = new Set();
      this.restrictScheme = true;
      for (const scheme of only) {
        this.#registerScheme(scheme);
      }
    } else {
      this.schemes = new Set(schemes || []);
      if (Array.isArray(allow) && allow.length) {
        for (const scheme of allow) {
          this.#registerScheme(scheme);
        }
      }
      if (Array.isArray(deny) && deny.length) {
        for (const scheme of deny) {
          const normalized = normalizeURL(scheme, true);
          if (normalized) {
            this.schemeMap.set(normalized, false);
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
    if (
      !normalizedScheme ||
      REG_SCRIPT_OR_BLOB.test(normalizedScheme) ||
      !REG_SCHEME.test(normalizedScheme)
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
    this.schemeMap.set(normalizedScheme, true);
    this.schemes.add(normalizedScheme);
    return true;
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
    const urlObj = parseURL(url, null, true);
    if (!urlObj) {
      if (ctx.allowRelative && !REG_VERIFY_RELATIVE.test(url)) {
        const dummyURL = parseURL(url, DUMMY_BASE);
        if (dummyURL) {
          const { protocol, hostname, pathname, search, hash } = dummyURL;
          if (protocol === 'http:' && hostname === 'dummy.local') {
            return this.#sanitizeStandardURL(`${pathname}${search}${hash}`);
          }
        }
      }
      return null;
    }
    const scheme = normalizeURL(urlObj.protocol, true);
    if (ctx.restrictScheme && !ctx.schemeMap.has(scheme)) {
      return null;
    }
    if (scheme.includes('+')) {
      const schemeParts = scheme.split('+');
      if (
        ctx.schemeMap.get(scheme) === false ||
        schemeParts.some(part => ctx.schemeMap.get(part) === false)
      ) {
        return null;
      }
    } else if (ctx.schemeMap.get(scheme) === false) {
      return null;
    }
    if (scheme === 'data') {
      return this.#sanitizeDataURL(urlObj, ctx);
    }
    return this.#sanitizeStandardURL(urlObj.href);
  }

  /**
   * Decodes, verifies inner protocols, and purifies Data URLs.
   * @private
   * @param {URL} urlObj - The URL object.
   * @param {SanitizeContext} ctx - The sanitization context.
   * @returns {string|null} Sanitized Data URL or null.
   */
  #sanitizeDataURL(urlObj, ctx) {
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
      return `data:${mediaTypes.join(';')},${parsedData}`;
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
    try {
      ctx.domPurify.addHook('uponSanitizeAttribute', (node, evt) =>
        this.#handleSanitizeAttribute(node, evt, ctx)
      );
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
    const base64Data = encodeBufferToBase64(buffer);
    const dataUrl = `data:${mimeType ? `${mimeType};base64` : 'base64'},${base64Data}`;
    if (
      Number.isInteger(options.maxLength) &&
      dataUrl.length > options.maxLength
    ) {
      throw new RangeError(
        `URL length ${dataUrl.length} exceeds max length ${options.maxLength}.`
      );
    }
    const ctx = new SanitizeContext(options, domPurify);
    if (!ctx.schemeMap.get('data')) {
      return null;
    }
    const urlObj = parseURL(dataUrl);
    if (!urlObj) {
      return null;
    }
    return this.#sanitizeDataURL(urlObj, ctx);
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
    return this.#sanitizeDataURL(urlObj, ctx);
  }
}
