/**
 * sanitizer.js
 */

/* shared */
import { domPurify } from './dompurify.js';
import { getType, isString } from './common.js';
import {
  URISchemes,
  escapeURLEncodedHTMLChars,
  extractDataUrlComponents,
  fetchBlobAsDataURL,
  getSchemeParts,
  getURLScheme,
  parseBase64,
  parseURLEncodedNumCharRef,
  trimTrailingEmptyQueryAndHash,
  truncateURL
} from './uri-util.js';

/* constants */
import { MAX_BLOB_SIZE, MAX_NEST } from './constant.js';
import {
  REG_AMP_ENC,
  REG_MIME_DOM,
  REG_SCHEME,
  REG_SCRIPT,
  REG_SCRIPT_BLOB,
  REG_TAG_QUOT,
  REG_VERIFY_RELATIVE
} from './regexp.js';
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
const INTERNAL_PURIFY_CONFIG = Object.freeze({
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
});
const DEFAULT_OPTS = Object.freeze({
  allow: Object.freeze([]),
  deny: Object.freeze([]),
  only: Object.freeze([]),
  allowRelative: false,
  debug: false,
  revokeObjectURL: false,
  maxBlobSize: MAX_BLOB_SIZE
});

/* typedef */
/**
 * The parsed result of a data URL.
 * @typedef {object} InspectedDataURL
 * @property {string} mime - The MIME type of the data.
 * @property {boolean} base64 - Indicates whether the data is base64-encoded.
 * @property {string} data - The actual data part of the data URL.
 */

/**
 * The result of an inspected URL, extending the standard URL API.
 * The properties except for input and valid are omitted for invalid URLs.
 * @typedef {object} InspectedURLResult
 * @property {string} input - The original URL input.
 * @property {boolean} valid - Indicates whether the URL passed sanitization rules.
 * @property {string} [reason] - The reason why the URL is invalid.
 * @property {InspectedDataURL | null} [data] - The parsed result of a data URL. Null if not a data URL.
 * @property {string} [href] - The sanitized URL input.
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
 * Internal debug logger.
 * @param {boolean} isDebug - Flag to enable or disable debug output.
 * @param {string} message - The message to output.
 * @param {Error} [error] - The caught error object, if any.
 * @returns {void}
 */
export const logDebug = (isDebug, message, error) => {
  if (isDebug) {
    console.warn(`[URLSanitizer Debug] ${message}`, error);
  }
};

/**
 * Context manager for the sanitization process.
 */
export class SanitizeContext {
  /**
   * @param {object} opt - Sanitization options.
   * @param {object} domPurifyInstance - The DOMPurify instance.
   */
  constructor(opt, domPurifyInstance) {
    this.debug = !!opt?.debug;
    this.domPurify = domPurifyInstance;
    this.nest = 0;
    this.recurse = new Set();
    this.schemeMap = new Map([
      ['blob', false],
      ['data', false],
      ['file', false],
      ['javascript', false],
      ['vbscript', false]
    ]);
  }

  /**
   * Enters a new level of nested URL sanitization.
   * Tracks the URL to prevent circular references.
   * @param {string} url - The URL being processed.
   * @returns {boolean} True if it is safe to proceed, false if circular reference detected.
   */
  enter(url) {
    if (this.recurse.has(url)) {
      logDebug(
        this.debug,
        `Circular Data URL detected and skipped: ${truncateURL(url)}`
      );
      return false;
    }
    this.nest++;
    this.recurse.add(url);
    return true;
  }

  /**
   * Leaves the current level of nested URL sanitization.
   * Cleans up the tracking state after processing the URL.
   * @param {string} url - The URL that finished processing.
   */
  leave(url) {
    this.nest--;
    this.recurse.delete(url);
  }
}

/**
 * URL sanitizer
 */
export class URLSanitizer extends URISchemes {
  /* private fields */
  #allowedSchemes;

  /**
   * NOTE: Global Context Pattern for DOMPurify Hooks
   * - DOMPurify hooks (e.g., 'uponSanitizeAttribute') are registered globally
   * and do not accept custom arguments (like `this` or `ctx`).
   * To pass the current sanitization context into the hook, we temporarily
   * store it in static fields (#currentInstance and #currentCtx).
   * - This is entirely safe and immune to race conditions because JavaScript
   * runs on a single thread and DOMPurify's sanitize() is synchronous.
   * The context is safely restored via try/finally block in #purify() even
   * during recursive calls.
   */
  /** @type {URLSanitizer | null} */
  static #currentInstance = null;
  /** @type {SanitizeContext | null} */
  static #currentCtx = null;

  /**
   * DOMPurify 'uponSanitizeAttribute' hook callback.
   * @private
   * @static
   * @param {Node} node - The DOM node being sanitized.
   * @param {object} evt - The event object containing attribute details.
   */
  static #uponSanitizeAttribute(node, evt) {
    if (!evt.attrValue || !/^\s*data:/i.test(evt.attrValue)) {
      return;
    }
    /** @type {URLSanitizer | null} */
    const sanitizer = URLSanitizer.#currentInstance;
    const ctx = URLSanitizer.#currentCtx;
    if (!sanitizer || !ctx) {
      return;
    }
    const urlObj = URL.parse(evt.attrValue);
    if (!urlObj) {
      return;
    }
    if (urlObj.protocol === 'data:') {
      const originalUrl = evt.attrValue;
      if (!ctx.enter(originalUrl)) {
        evt.attrValue = '';
        return;
      }
      try {
        const sanitized = sanitizer.#process(
          originalUrl,
          {
            allow: ['data'],
            deny: [],
            only: [],
            allowRelative: false
          },
          ctx
        );
        evt.attrValue = sanitized || '';
      } finally {
        ctx.leave(originalUrl);
      }
    }
  }

  static {
    domPurify.setConfig(INTERNAL_PURIFY_CONFIG);
    domPurify.addHook(
      'uponSanitizeAttribute',
      URLSanitizer.#uponSanitizeAttribute
    );
  }

  constructor() {
    super();
    this.#allowedSchemes = new Set(super.get());
  }

  /**
   * Helper method to register schemes for the 'allow' or 'only' options.
   * @private
   * @param {string} item - The scheme to register.
   * @param {string} listName - The name of the target option list.
   * @param {Set<string>} allowedSchemes - The local set of allowed schemes.
   * @param {Map<string, boolean>} schemeMap - The local map of schemes.
   * @param {SanitizeContext} ctx - The context for state management.
   * @returns {boolean} True if the scheme is successfully registered.
   */
  #registerScheme(item, listName, allowedSchemes, schemeMap, ctx) {
    if (REG_SCRIPT_BLOB.test(item)) {
      return false;
    }
    const schemeParts = item.split('+');
    const isScript = schemeParts.some(s => REG_SCRIPT.test(s));
    if (isScript || !REG_SCHEME.test(item)) {
      const msg = `Failed to add scheme '${item}' in '${listName}' list.`;
      logDebug(ctx.debug, msg);
      return false;
    }
    schemeMap.set(item, true);
    allowedSchemes.add(item);
    return true;
  }

  /**
   * Purifies a URL-encoded DOM string to prevent XSS.
   * @private
   * @param {string} dom - The URL-encoded DOM string.
   * @param {SanitizeContext} ctx - The context for state management.
   * @returns {string} The purified DOM string.
   */
  #purify(dom, ctx) {
    let decodedDom = dom;
    try {
      decodedDom = decodeURIComponent(dom);
    } catch {
      // fall through
    }
    const prevInstance = URLSanitizer.#currentInstance;
    const prevCtx = URLSanitizer.#currentCtx;
    URLSanitizer.#currentInstance = this;
    URLSanitizer.#currentCtx = ctx;
    let purifiedDom;
    try {
      purifiedDom = ctx.domPurify.sanitize(decodedDom);
    } finally {
      URLSanitizer.#currentInstance = prevInstance;
      URLSanitizer.#currentCtx = prevCtx;
    }
    purifiedDom = trimTrailingEmptyQueryAndHash(purifiedDom);
    try {
      return encodeURI(purifiedDom);
    } catch {
      return purifiedDom;
    }
  }

  /**
   * Internal recursive method for sanitization.
   * @private
   * @param {string} url - The URL string to sanitize.
   * @param {object} rules - The sanitization rules.
   * @param {string[]} rules.allow - Allowed schemes.
   * @param {boolean} rules.allowRelative - Allow relative URLs.
   * @param {string[]} rules.deny - Denied schemes.
   * @param {string[]} rules.only - Exclusively allowed schemes.
   * @param {SanitizeContext} ctx - Internal context for state.
   * @returns {string|null} The sanitized URL, or null.
   */
  #process(url, { allow, allowRelative, deny, only }, ctx) {
    if (ctx.nest > MAX_NEST) {
      throw new Error('Data URLs nested too deeply.');
    }
    // Resolve allowed/denied schemes
    const { allowedSchemes, restrictScheme, schemeMap } =
      this.#resolveSchemeRules({ allow, deny, only }, ctx);
    // Parse and verify the URL
    const {
      isDataUrl,
      isRelative,
      isVerified,
      scheme,
      schemeParts,
      urlObj,
      urlToSanitize
    } = this.#parseAndVerifyURL(url, allowRelative, allowedSchemes, ctx);
    if (!isVerified) {
      return null;
    }
    // Check if the scheme is allowed
    if (
      !this.#isSchemeAllowed(
        scheme,
        schemeParts,
        restrictScheme,
        schemeMap,
        isRelative
      )
    ) {
      return null;
    }
    // Sanitize based on URL type
    if (isDataUrl) {
      return this.#sanitizeDataURL(urlObj, scheme, ctx);
    }
    return this.#sanitizeStandardURL(urlToSanitize);
  }

  /**
   * Resolves allow, deny, and only rules into mappings.
   * @private
   * @param {object} rules - The sanitization rules.
   * @param {string[]} rules.allow - Allowed schemes.
   * @param {string[]} rules.deny - Denied schemes.
   * @param {string[]} rules.only - Exclusively allowed schemes.
   * @param {SanitizeContext} ctx - Context for state management.
   * @returns {object} Resolved scheme objects and flags.
   */
  #resolveSchemeRules({ allow, deny, only }, ctx) {
    let allowedSchemes = this.#allowedSchemes;
    let restrictScheme = false;
    const schemeMap = new Map(ctx.schemeMap);
    if (Array.isArray(only) && only.length) {
      allowedSchemes = new Set();
      for (const item of only) {
        if (isString(item)) {
          const registered = this.#registerScheme(
            item.trim(),
            'only',
            allowedSchemes,
            schemeMap,
            ctx
          );
          if (registered && !restrictScheme) {
            restrictScheme = true;
          }
        }
      }
    } else {
      if (Array.isArray(allow) && allow.length) {
        allowedSchemes = new Set(this.#allowedSchemes);
        for (const item of allow) {
          if (isString(item)) {
            this.#registerScheme(
              item.trim(),
              'allow',
              allowedSchemes,
              schemeMap,
              ctx
            );
          }
        }
      }
      if (Array.isArray(deny) && deny.length) {
        for (let item of deny) {
          if (isString(item)) {
            item = item.trim();
            if (item) {
              schemeMap.set(item, false);
            }
          }
        }
      }
    }
    return { allowedSchemes, restrictScheme, schemeMap };
  }

  /**
   * Parses and verifies absolute and relative URLs.
   * @private
   * @param {string} url - The URL to parse.
   * @param {boolean} allowRelative - Allow relative URLs.
   * @param {Set<string>} allowedSchemes - Permitted schemes.
   * @param {SanitizeContext} ctx - Context for logging and state.
   * @returns {object} Parsed URL properties and flags.
   */
  #parseAndVerifyURL(url, allowRelative, allowedSchemes, ctx) {
    const normalizedUrl = url.normalize('NFKC');
    const urlObj = URL.parse(normalizedUrl);
    let isVerified = this.verifyParsed(urlObj, allowedSchemes);
    let isRelative = false;
    let relativeParsedPath = '';
    // Handle Relative URLs
    if (!isVerified && allowRelative && !REG_VERIFY_RELATIVE.test(url)) {
      const dummyUrl = URL.parse(url, 'http://dummy.local');
      const dummyUrlNormalized = URL.parse(normalizedUrl, 'http://dummy.local');
      if (dummyUrl && dummyUrlNormalized) {
        if (
          dummyUrl.protocol === 'http:' &&
          dummyUrl.hostname === 'dummy.local' &&
          dummyUrlNormalized.protocol === 'http:'
        ) {
          isVerified = true;
          isRelative = true;
          relativeParsedPath = `${dummyUrl.pathname}${dummyUrl.search}${dummyUrl.hash}`;
        }
      } else {
        logDebug(ctx.debug, 'Failed to parse relative URL.');
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
        isDataUrl: false,
        scheme: '',
        schemeParts: [],
        urlToSanitize: relativeParsedPath
      };
    }
    const scheme = urlObj.protocol.replace(/:$/, '');
    const schemeParts = scheme.split('+');
    return {
      isRelative,
      isVerified,
      scheme,
      schemeParts,
      urlObj,
      isDataUrl: schemeParts.includes('data'),
      urlToSanitize: urlObj.href
    };
  }

  /**
   * Evaluates if the extracted scheme is permitted.
   * @private
   * @param {string} scheme - The normalized URL scheme.
   * @param {string[]} schemeParts - Parts of the split scheme.
   * @param {boolean} restrictScheme - If rules strictly limit.
   * @param {Map<string, boolean>} schemeMap - Scheme rules map.
   * @param {boolean} isRelative - If the URL is relative.
   * @returns {boolean} True if the scheme is allowed.
   */
  #isSchemeAllowed(scheme, schemeParts, restrictScheme, schemeMap, isRelative) {
    if (isRelative) {
      return true;
    }
    if (restrictScheme) {
      return schemeParts.every(s => schemeMap.get(s));
    }
    for (const [key, value] of schemeMap.entries()) {
      const bool =
        value || (scheme !== key && schemeParts.every(s => s !== key));
      if (!bool) {
        return false;
      }
    }
    return true;
  }

  /**
   * Decodes, verifies inner protocols, and purifies data URLs.
   * @private
   * @param {object} urlObj - The URL object.
   * @param {string} scheme - The URL scheme.
   * @param {SanitizeContext} ctx - Context for DOMPurify sanitization.
   * @returns {string|null} Sanitized data URL or null.
   */
  #sanitizeDataURL(urlObj, scheme, ctx) {
    const { mediaType, mediaTypes, data, isBase64 } = extractDataUrlComponents(
      urlObj.pathname,
      urlObj.search,
      urlObj.hash
    );
    let parsedData = data;
    if (isBase64) {
      try {
        parsedData = parseBase64(data);
      } catch (e) {
        logDebug(ctx.debug, 'Failed to parse base64 data.', e);
        return null;
      }
    }
    try {
      const decodedData = parseURLEncodedNumCharRef(parsedData).trim();
      const normalizedData = decodedData.normalize('NFKC');
      const dummy = 'http://dummy.local';
      const parsedUrl = URL.parse(normalizedData, dummy);
      if (!parsedUrl) {
        logDebug(ctx.debug, 'Failed to parse inner data URL protocol.');
        return null;
      }
      const dataScheme = parsedUrl.protocol;
      const dataSchemeParts = getSchemeParts(dataScheme);
      if (dataSchemeParts.some(s => REG_SCRIPT_BLOB.test(s))) {
        return null;
      }
    } catch (e) {
      logDebug(ctx.debug, 'Failed to parse inner data URL protocol.', e);
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
   * Applies regex cleanups to standard non-data URLs.
   * Strips out trailing queries or problematic characters.
   * @private
   * @param {string} urlToSanitize - The absolute/relative URL.
   * @returns {string|null} Cleaned URL string or null.
   */
  #sanitizeStandardURL(urlToSanitize) {
    let sanitized = urlToSanitize;
    const patterns = [REG_TAG_QUOT, REG_AMP_ENC];
    for (const pattern of patterns) {
      const match = pattern.exec(sanitized);
      if (match) {
        sanitized = sanitized.substring(0, match.index).replace(/[?&]$/, '');
      }
    }
    return sanitized;
  }

  /**
   * Executes the core sanitization logic.
   * @private
   * @param {string} url - The URL string to sanitize.
   * @param {object} opt - Sanitization options.
   * @returns {string|null} The sanitized URL, or null.
   */
  #executeSanitize(url, opt) {
    if (!url || !isString(url)) {
      return null;
    }
    const { allow, allowRelative, debug, deny, maxLength, only } = opt;
    if (maxLength && url.length > maxLength) {
      const msg = `URL length ${url.length} exceeds maxLength ${maxLength}.`;
      throw new RangeError(msg);
    }
    const hasRestrictiveRules =
      (Array.isArray(deny) && deny.length) ||
      (Array.isArray(only) && only.length) ||
      allowRelative;
    // Early return for standard HTTP/HTTPS URLs without restrictive rules.
    if (
      !hasRestrictiveRules &&
      (url.startsWith('https://') || url.startsWith('http://')) &&
      !REG_TAG_QUOT.test(url) &&
      !url.includes('data:')
    ) {
      const urlObj = URL.parse(url);
      if (urlObj) {
        return urlObj.href.replace(/%26/g, escapeURLEncodedHTMLChars);
      } else {
        logDebug(debug, `Failed to parse URL.`);
        return null;
      }
    }
    const ctx = new SanitizeContext(opt, domPurify);
    return this.#process(url, { allow, allowRelative, deny, only }, ctx);
  }

  /**
   * Sanitizes the given URL.
   * @param {string} url - The URL string to sanitize.
   * @param {object} [opt] - Sanitization options.
   * @param {string[]} [opt.allow] - An array of schemes to allow.
   * @param {string[]} [opt.deny] - An array of schemes to deny.
   * @param {string[]} [opt.only] - An array of specific schemes to allow.
   * @param {boolean} [opt.allowRelative] - Allow relative URLs.
   * @param {boolean} [opt.debug] - Flag to enable debug mode.
   * @param {number} [opt.maxBlobSize] - The maximum allowed blob size in bytes.
   * @param {number} [opt.maxLength] - The maximum allowed URL length.
   * @returns {string|null} The sanitized URL, or null.
   */
  sanitize(url, opt = {}) {
    const options = {
      ...DEFAULT_OPTS,
      ...opt
    };
    return this.#executeSanitize(url, options);
  }

  /**
   * Inspects, parses, and sanitizes the given URL.
   * @param {string} url - The URL string to parse.
   * @returns {InspectedURLResult} The result of an inspected URL.
   */
  inspect(url) {
    const inspectedURL = {
      input: url,
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
    let sanitizedUrl;
    let invalidReason = null;
    try {
      sanitizedUrl = this.#executeSanitize(url, {
        ...DEFAULT_OPTS,
        allow: ['data'],
        allowRelative: true
      });
      if (!sanitizedUrl) {
        invalidReason =
          'Sanitization failed (blocked by allowed schemes or rules).';
      }
    } catch (e) {
      invalidReason = e.message;
    }
    if (sanitizedUrl) {
      // Reparse the sanitized string to safely extract updated properties.
      const urlObj = URL.parse(sanitizedUrl);
      inspectedURL.valid = true;
      if (urlObj) {
        const { pathname, protocol } = urlObj;
        const schemeParts = getSchemeParts(protocol);
        const isDataUrl = schemeParts.includes('data');
        if (isDataUrl) {
          const [mediaType, ...dataParts] = pathname.split(',');
          const data = `${dataParts.join(',')}${urlObj.search}${urlObj.hash}`;
          const mediaTypes = mediaType.split(';');
          const isBase64 = mediaTypes[mediaTypes.length - 1] === 'base64';
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
        // Fallback for the valid relative URL without a base URL.
        inspectedURL.data = null;
        inspectedURL.href = sanitizedUrl;
      }
    } else {
      inspectedURL.valid = false;
      inspectedURL.reason = invalidReason;
    }
    return inspectedURL;
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
    const normalizedScheme = this.normalize(scheme);
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
    const normalizedScheme = this.normalize(scheme);
    const schemeParts = normalizedScheme.split('+');
    const isScript = schemeParts.some(s => REG_SCRIPT.test(s));
    if (isScript || !REG_SCHEME.test(normalizedScheme)) {
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
    const normalizedScheme = this.normalize(scheme);
    return this.#allowedSchemes.delete(normalizedScheme);
  }

  /**
   * Resets the registered schemes back to the default initial list.
   * @returns {void}
   */
  reset() {
    this.#allowedSchemes = new Set(super.get());
  }

  /**
   * Verifies if the given URI is valid and its scheme is allowed.
   * @param {string} uri - The URI string to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the URI is syntactically valid and permitted.
   */
  verify(uri, schemes) {
    return super.verify(uri, schemes ?? this.#allowedSchemes);
  }
}

/* instance */
const urlSanitizer = new URLSanitizer();

/**
 * Asynchronously sanitizes the given URL.
 * NOTE: `blob`, `data`, and `file` schemes must be explicitly allowed.
 * Given a `blob` URL, it securely converts and returns a sanitized `data` URL.
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {string[]} [opt.allow] - The array of schemes to allow.
 * @param {string[]} [opt.deny] - The array of schemes to deny.
 * @param {string[]} [opt.only] - The array of specific schemes to allow.
 * @param {boolean} [opt.allowRelative] - Allow relative URLs.
 * @param {boolean} [opt.debug] - Enable debug mode.
 * @param {boolean} [opt.revokeObjectURL] - Revokes the blob URL after sanitization.
 * @param {number} [opt.maxBlobSize] - The maximum allowed blob size in bytes.
 * @param {number} [opt.maxLength] - The maximum allowed URL length
 * @returns {Promise<string|null>} A promise resolving to the sanitized URL, or null.
 */
export const sanitizeURL = async (url, opt = {}) => {
  if (!url || !isString(url)) {
    return null;
  }
  const options = {
    ...DEFAULT_OPTS,
    ...opt
  };
  const scheme = getURLScheme(url);
  if (scheme === undefined) {
    if (options.allowRelative) {
      return urlSanitizer.sanitize(url, options);
    }
    logDebug(options.debug, `Invalid URL input: ${truncateURL(url)}`);
    return null;
  }
  if (scheme === 'blob') {
    const { allow, deny, only } = options;
    let res = null;
    if (
      (allow.includes('blob') && !deny.includes('blob')) ||
      only.includes('blob')
    ) {
      let data;
      try {
        data = await fetchBlobAsDataURL(url, options.maxBlobSize);
      } catch (e) {
        const msg = `Failed to fetch and convert blob URL: ${truncateURL(url)}`;
        logDebug(options.debug, msg, e);
      }
      if (data) {
        if (only.length) {
          if (!only.includes('data')) {
            options.only = [...only, 'data'];
          }
        } else {
          if (!allow.includes('data')) {
            options.allow = [...allow, 'data'];
          }
          options.deny = options.deny.filter(s => s !== 'data');
        }
        res = urlSanitizer.sanitize(data, options);
      }
    }
    if (options.revokeObjectURL) {
      URL.revokeObjectURL(url);
    }
    return res;
  }
  return urlSanitizer.sanitize(url, options);
};

/**
 * Synchronously sanitizes the given URL.
 * NOTE: `data` and `file` schemes must be explicitly allowed.
 * The `blob` scheme is not supported and will return `null`.
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {string[]} [opt.allow] - The array of schemes to allow.
 * @param {string[]} [opt.deny] - The array of schemes to deny.
 * @param {string[]} [opt.only] - The array of specific schemes to allow.
 * @param {boolean} [opt.allowRelative] - Allow relative URLs.
 * @param {boolean} [opt.debug] - Enable debug mode.
 * @param {boolean} [opt.revokeObjectURL] - Revokes the blob URL.
 * @param {number} [opt.maxLength] - The maximum allowed URL length.
 * @returns {string|null} The sanitized URL, or null if denied.
 */
export const sanitizeURLSync = (url, opt = {}) => {
  if (!url || !isString(url)) {
    return null;
  }
  const options = {
    ...DEFAULT_OPTS,
    ...opt
  };
  const scheme = getURLScheme(url);
  if (scheme === undefined) {
    if (options.allowRelative) {
      return urlSanitizer.sanitize(url, options);
    }
    logDebug(options.debug, `Invalid URL input: ${truncateURL(url)}`);
    return null;
  }
  if (scheme === 'blob') {
    if (options.revokeObjectURL) {
      URL.revokeObjectURL(url);
    }
    return null;
  }
  return urlSanitizer.sanitize(url, options);
};

/**
 * Sanitizes the given URL and returns its parsed components.
 * NOTE: blob URLs are not revoked after inspection.
 * @param {string} url - The URL string to inspect.
 * @returns {Promise<InspectedURLResult>} A promise resolving to the inspected URL result.
 */
export const inspectURL = async url => {
  if (isString(url)) {
    const parsedUrl = URL.parse(url);
    if (parsedUrl?.protocol === 'blob:') {
      try {
        const dataUrl = await fetchBlobAsDataURL(parsedUrl.href);
        const inspectedURLResult = urlSanitizer.inspect(dataUrl);
        inspectedURLResult.input = url;
        return inspectedURLResult;
      } catch (e) {
        return { input: url, valid: false, reason: e.message };
      }
    }
  }
  return urlSanitizer.inspect(url);
};

/**
 * Checks if the given string is a valid URI and is registered.
 * @param {string} uri - The URI string to verify.
 * @returns {boolean} True if valid and registered, false otherwise.
 */
export const isValidURI = uri => urlSanitizer.verify(uri);

/**
 * @deprecated Use {@link isValidURI} instead.
 * @param {string} uri - The URI string to verify.
 * @returns {boolean} True if valid and registered, false otherwise.
 */
export const isURISync = uri => isValidURI(uri);

/* export instance */
export default urlSanitizer;
