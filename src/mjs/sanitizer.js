/**
 * sanitizer.js
 */

/* shared */
import { domPurify } from './dompurify.js';
import { getType, logDebug, isString } from './common.js';
import {
  URISchemes,
  escapeURLEncodedHTMLChars,
  extractDataURLComponents,
  getSchemeParts,
  parseBase64,
  parseURLEncodedNumCharRef,
  trimTrailingEmptyQueryAndHash,
  truncateURL
} from './uri-util.js';

/* constants */
import {
  CHUNK_SIZE,
  DECI,
  DUMMY_BASE,
  MAX_BLOB_SIZE,
  MAX_NEST,
  MAX_URL_LENGTH
} from './constant.js';
import {
  REG_AMP_ENC,
  REG_MIME_DOM,
  REG_SCHEME,
  REG_SCRIPT,
  REG_SCRIPT_OR_BLOB,
  REG_TAG_QUOT,
  REG_VERIFY_RELATIVE
} from './regexp.js';
const IS_NODE = globalThis.process?.versions?.node !== undefined;
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
const DEFAULT_OPTS = Object.freeze({
  allow: Object.freeze([]),
  deny: Object.freeze([]),
  only: Object.freeze([]),
  allowRelative: false,
  debug: false,
  revokeObjectURL: false,
  maxBlobSize: MAX_BLOB_SIZE,
  maxLength: MAX_URL_LENGTH
});

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
   * Leaves the current level of nested URL sanitization.
   * Cleans up the tracking state after processing the URL.
   * @param {string} url - The URL that finished processing.
   */
  leave(url) {
    this.nest--;
    this.recurse.delete(url);
  }
}

/* worker setup */
let workerInstance = null;
let workerMessageId = 0;
const workerPendingTasks = new Map();

/**
 * Retrieves the singleton Web Worker instance.
 * @returns {Worker|null} The Web Worker instance, or null if not supported.
 */
export const getWorker = () => {
  if (!workerInstance && typeof Worker !== 'undefined') {
    workerInstance = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module'
    });
    workerInstance.addEventListener('error', evt => {
      for (const [, task] of workerPendingTasks) {
        task.reject(evt);
      }
      workerPendingTasks.clear();
      workerInstance = null;
    });
    workerInstance.addEventListener('message', evt => {
      const { id, success, result, error } = evt.data;
      const task = workerPendingTasks.get(id);
      if (task) {
        workerPendingTasks.delete(id);
        if (success) {
          task.resolve(result);
        } else {
          task.reject(new Error(error));
        }
      }
    });
  }
  return workerInstance;
};

/**
 * Offloads the processing and validation of a buffer to a Web Worker.
 * @param {ArrayBuffer} buffer - The ArrayBuffer to process.
 * @param {string} mimeType - The MIME type of the buffer.
 * @returns {Promise<object>} A promise resolving to the processing result.
 */
export const processBufferViaWorker = (buffer, mimeType) => {
  const worker = getWorker();
  if (!worker) {
    throw new Error('Worker is not available in this environment.');
  }
  return new Promise((resolve, reject) => {
    const id = ++workerMessageId;
    workerPendingTasks.set(id, { resolve, reject });
    worker.postMessage({ id, action: 'PROCESS_BUFFER', buffer, mimeType }, [
      buffer
    ]);
  });
};

/**
 * Encodes an ArrayBuffer to a Base64 string.
 * @private
 * @param {ArrayBuffer} buffer - The buffer to encode.
 * @returns {string} The Base64 string.
 */
const encodeBufferToBase64 = buffer => {
  if (IS_NODE && globalThis.Buffer) {
    return globalThis.Buffer.from(buffer).toString('base64');
  }
  const uint8arr = new Uint8Array(buffer);
  const chunks = [];
  for (let i = 0; i < uint8arr.length; i += CHUNK_SIZE) {
    chunks.push(String.fromCharCode(...uint8arr.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(chunks.join(''));
};

/* blob handlers */
/**
 * Reads a stream in chunks and generates an ArrayBuffer.
 * @private
 * @param {Response} response - The Response instance.
 * @param {number} maxSize - The maximum allowed size in bytes.
 * @returns {Promise<ArrayBuffer>} A promise resolving to the generated ArrayBuffer.
 */
const readStreamInChunksAsArrayBuffer = async (response, maxSize) => {
  const reader = response.body.getReader();
  const chunks = [];
  try {
    let accumulatedSize = 0;
    while (accumulatedSize <= maxSize) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      accumulatedSize += value.byteLength;
      if (accumulatedSize > maxSize) {
        await reader.cancel('Size limit exceeded');
        throw new DOMException(
          `Payload (${accumulatedSize} bytes) exceeds max (${maxSize} bytes).`,
          'NotReadableError'
        );
      }
      chunks.push(value);
    }
    const combined = new Uint8Array(accumulatedSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return combined.buffer;
  } finally {
    reader.releaseLock();
  }
};

/**
 * Fetches a Blob URL and extracts its ArrayBuffer and MIME type.
 * @param {string} url - The Blob URL to fetch.
 * @param {number} [maxBlobSize] - The maximum allowed Blob size in bytes.
 * @returns {Promise<{ buffer: ArrayBuffer, mimeType: string }>} A promise resolving to the buffer and MIME type.
 */
const fetchBlobAsArrayBuffer = async (url, maxBlobSize) => {
  let maxSize = MAX_BLOB_SIZE;
  if (Number.isInteger(maxBlobSize) && maxBlobSize > 0) {
    maxSize = maxBlobSize;
  }
  const response = await fetch(url);
  if (!response.ok) {
    const truncatedURL = truncateURL(url);
    let msg = `Failed to fetch ${truncatedURL}`;
    if (Number.isInteger(response.status)) {
      if (response.statusText) {
        msg += `: ${response.status} ${response.statusText}`;
      } else {
        msg += `: ${response.status}`;
      }
    }
    throw new Error(msg);
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, DECI);
    if (Number.isInteger(parsedLength) && parsedLength > maxSize) {
      throw new DOMException(
        `Payload (${parsedLength} bytes) exceeds max (${maxSize} bytes).`,
        'NotReadableError'
      );
    }
  }
  const mimeType = response.headers.get('content-type') || '';
  let buffer;
  if (response.body) {
    buffer = await readStreamInChunksAsArrayBuffer(response, maxSize);
  } else {
    const blob = await response.blob();
    if (blob.size > maxSize) {
      throw new DOMException(
        `Payload (${blob.size} bytes) exceeds max (${maxSize} bytes).`,
        'NotReadableError'
      );
    }
    buffer = await blob.arrayBuffer();
  }
  return { buffer, mimeType };
};

/**
 * URL sanitizer
 */
export class URLSanitizer extends URISchemes {
  /* private fields */
  #allowedSchemes;

  constructor() {
    super();
    this.#allowedSchemes = new Set(super.get());
  }

  /**
   * Executes the sanitization logic.
   * @private
   * @param {string} url - The URL string to sanitize.
   * @param {object} opt - Sanitization options.
   * @returns {string|null} The sanitized URL, or null.
   */
  #executeSanitize(url, opt) {
    if (!url || !isString(url)) {
      return null;
    }
    const { allow, allowRelative, deny, maxLength, only } = opt;
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
      const urlObj = this.parse(url, null, true);
      if (urlObj) {
        return urlObj.href.replace(/%26/g, escapeURLEncodedHTMLChars);
      }
      return null;
    }
    const ctx = new SanitizeContext(opt, domPurify);
    return this.#process(url, { allow, allowRelative, deny, only }, ctx);
  }

  /**
   * Process recursive method for sanitization.
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
      isDataURL,
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
    if (isDataURL) {
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
      restrictScheme = true;
      for (const item of only) {
        if (isString(item)) {
          this.#registerScheme(item, allowedSchemes, schemeMap);
        }
      }
    } else {
      if (Array.isArray(allow) && allow.length) {
        allowedSchemes = new Set(this.#allowedSchemes);
        for (const item of allow) {
          if (isString(item)) {
            this.#registerScheme(item, allowedSchemes, schemeMap);
          }
        }
      }
      if (Array.isArray(deny) && deny.length) {
        for (const item of deny) {
          if (isString(item)) {
            const normalized = this.normalize(item, true);
            if (normalized) {
              schemeMap.set(normalized, false);
            }
          }
        }
      }
    }
    return { allowedSchemes, restrictScheme, schemeMap };
  }

  /**
   * Helper method to register schemes for the 'allow' or 'only' options.
   * @private
   * @param {string} item - The scheme to register.
   * @param {Set<string>} allowedSchemes - The local set of allowed schemes.
   * @param {Map<string, boolean>} schemeMap - The local map of schemes.
   * @returns {boolean} True if the scheme is successfully registered.
   */
  #registerScheme(item, allowedSchemes, schemeMap) {
    const normalizedScheme = this.normalize(item, true);
    if (!this.#isValidScheme(normalizedScheme)) {
      return false;
    }
    schemeMap.set(normalizedScheme, true);
    allowedSchemes.add(normalizedScheme);
    return true;
  }

  /**
   * Validates if a normalized URI scheme is syntactically correct.
   * @private
   * @param {string} normalizedScheme - The normalized URI scheme to validate.
   * @returns {boolean} True if the scheme satisfies the syntax and requirements.
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
   * Parses and verifies absolute and relative URLs.
   * @private
   * @param {string} url - The URL to parse.
   * @param {boolean} allowRelative - Allow relative URLs.
   * @param {Set<string>} allowedSchemes - Permitted schemes.
   * @param {SanitizeContext} ctx - Context for logging and state.
   * @returns {object} Parsed URL properties and flags.
   */
  #parseAndVerifyURL(url, allowRelative, allowedSchemes, ctx) {
    const urlObj = this.parse(url, null, true);
    let isVerified = this.verifyScheme(urlObj?.protocol, allowedSchemes);
    let isRelative = false;
    let relativePath = '';
    // Handle Relative URLs
    if (!isVerified && allowRelative && !REG_VERIFY_RELATIVE.test(url)) {
      const dummyURL = this.parse(url, DUMMY_BASE);
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
    const scheme = this.normalize(urlObj.protocol, true);
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
      return schemeMap.has(scheme) || schemeParts.every(s => schemeMap.get(s));
    }
    for (const [key, value] of schemeMap.entries()) {
      if (!value && (scheme === key || schemeParts.includes(key))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Asynchronously processes and purifies a buffer via Worker.
   * @private
   * @param {ArrayBuffer} buffer - The buffer.
   * @param {string} mimeType - The MIME type.
   * @param {string} scheme - The URL scheme.
   * @param {SanitizeContext} ctx - Context for DOMPurify sanitization.
   * @returns {Promise<string|null>} Sanitized Data URL or null.
   */
  async #sanitizeBufferAsync(buffer, mimeType, scheme, ctx) {
    try {
      const result = await processBufferViaWorker(buffer, mimeType);
      if (!result.isValid) {
        return null;
      }
      let finalMimeType = result.mimeType || '';
      if (result.needsPurify) {
        const purified = this.#purify(result.parsedData, ctx);
        if (!purified) {
          return null;
        }
        finalMimeType = finalMimeType.replace(/;\s*base64\s*$/i, '');
        return `${scheme}:${finalMimeType},${purified}`;
      } else {
        const base64Data = encodeBufferToBase64(result.buffer);
        if (!/;\s*base64\s*$/i.test(finalMimeType)) {
          finalMimeType = finalMimeType ? `${finalMimeType};base64` : 'base64';
        }
        return `${scheme}:${finalMimeType},${base64Data}`;
      }
    } catch (e) {
      if (ctx.debug) {
        logDebug('Failed to process buffer via Worker.', e);
      }
      throw e;
    }
  }

  /**
   * Decodes, verifies inner protocols, and purifies Data URLs.
   * @private
   * @param {object} urlObj - The URL object.
   * @param {string} scheme - The URL scheme.
   * @param {SanitizeContext} ctx - Context for DOMPurify sanitization.
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
      const parsedURL = this.parse(decodedData, DUMMY_BASE);
      if (!parsedURL) {
        return null;
      }
      const dataScheme = parsedURL.protocol;
      const dataSchemeParts = getSchemeParts(dataScheme);
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
    const urlObj = this.parse(evt.attrValue, null, true);
    if (!urlObj || urlObj.protocol !== 'data:') {
      return;
    }
    const originalURL = evt.attrValue;
    if (!ctx.enter(originalURL)) {
      evt.attrValue = '';
      return;
    }
    try {
      const sanitized = this.#process(
        originalURL,
        { allow: ['data'], deny: [], only: [], allowRelative: false },
        ctx
      );
      evt.attrValue = sanitized || '';
    } finally {
      ctx.leave(originalURL);
    }
  }

  /**
   * Sanitizes URLs by stripping out trailing queries or problematic characters.
   * @private
   * @param {string} urlToSanitize - The absolute/relative URL.
   * @returns {string} The sanitized URL.
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
   * Sanitizes the given URL.
   * @param {string} url - The URL string to sanitize.
   * @param {object} [opt] - Sanitization options.
   * @param {string[]} [opt.allow] - An array of schemes to allow.
   * @param {string[]} [opt.deny] - An array of schemes to deny.
   * @param {string[]} [opt.only] - An array of specific schemes to allow.
   * @param {boolean} [opt.allowRelative] - Allow relative URLs.
   * @param {boolean} [opt.debug] - Flag to enable debug mode.
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
   * Asynchronously sanitizes an ArrayBuffer and converts it to a Data URL.
   * @param {ArrayBuffer} buffer - The target buffer.
   * @param {string} mimeType - The MIME type of the buffer.
   * @param {object} [opt] - Sanitization options.
   * @returns {Promise<string|null>} The sanitized Data URL, or null.
   */
  async sanitizeBuffer(buffer, mimeType, opt = {}) {
    if (!(buffer instanceof ArrayBuffer)) {
      return null;
    }
    const options = { ...DEFAULT_OPTS, ...opt };
    const ctx = new SanitizeContext(options, domPurify);
    const { schemeMap } = this.#resolveSchemeRules(options, ctx);
    if (!schemeMap.get('data')) {
      return null;
    }
    if (typeof Worker !== 'undefined') {
      try {
        return await this.#sanitizeBufferAsync(buffer, mimeType, 'data', ctx);
      } catch (e) {
        if (options.debug) {
          logDebug(
            'Failed to sanitize buffer asynchronously. Falling back to sync.',
            e
          );
        }
      }
    }
    const base64Data = encodeBufferToBase64(buffer);
    const dataUrl = `data:${mimeType ? `${mimeType};base64` : 'base64'},${base64Data}`;
    const urlObj = this.parse(dataUrl);
    if (!urlObj) {
      return null;
    }
    return this.#sanitizeDataURL(urlObj, 'data', ctx);
  }

  /**
   * Asynchronously sanitizes the Data URL.
   * @param {string} url - The URL string to sanitize.
   * @param {object} [opt] - Sanitization options.
   * @returns {Promise<string|null>} The sanitized Data URL, or null.
   */
  async sanitizeDataURL(url, opt = {}) {
    if (!url || !isString(url)) {
      return null;
    }
    const options = { ...DEFAULT_OPTS, ...opt };
    const { maxLength } = options;
    if (Number.isInteger(maxLength) && url.length > maxLength) {
      throw new RangeError(
        `URL length ${url.length} exceeds max length ${maxLength}.`
      );
    }
    const urlObj = this.parse(url);
    if (!urlObj) {
      return null;
    }
    const scheme = this.normalize(urlObj.protocol, true);
    if (scheme !== 'data') {
      return null;
    }
    if (typeof Worker !== 'undefined') {
      try {
        const { buffer, mimeType } = await fetchBlobAsArrayBuffer(
          urlObj.href,
          options.maxBlobSize
        );
        return await this.sanitizeBuffer(buffer, mimeType, options);
      } catch (e) {
        if (options.debug) {
          logDebug(
            `Failed to fetch data URL as buffer. Falling back to sync.`,
            e
          );
        }
      }
    }
    const ctx = new SanitizeContext(options, domPurify);
    const { schemeMap } = this.#resolveSchemeRules(options, ctx);
    if (!schemeMap.get(scheme)) {
      return null;
    }
    return this.#sanitizeDataURL(urlObj, scheme, ctx);
  }

  /**
   * Inspects, parses, and sanitizes the given URL.
   * @param {string} url - The URL string to parse.
   * @returns {InspectedURLResult} The result of an inspected URL.
   */
  inspect(url) {
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
      sanitizedURL = this.#executeSanitize(url, {
        ...DEFAULT_OPTS,
        allow: ['data'],
        allowRelative: true
      });
      if (!sanitizedURL) {
        invalidReason =
          'Sanitization failed (blocked by allowed schemes or rules).';
      }
    } catch (e) {
      invalidReason = e.message;
    }
    if (sanitizedURL) {
      // Reparse the sanitized string to safely extract updated properties.
      const urlObj = this.parse(sanitizedURL);
      inspectedURL.valid = true;
      if (urlObj) {
        const scheme = this.normalize(urlObj.protocol, true);
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
    const normalizedScheme = this.normalize(scheme, true);
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
    const normalizedScheme = this.normalize(scheme, true);
    if (!this.#isValidScheme(normalizedScheme)) {
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
    const normalizedScheme = this.normalize(scheme, true);
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
    return super.verifyURI(uri, schemes ?? this.#allowedSchemes);
  }
}

/* URLSanitizer instance */
const urlSanitizer = new URLSanitizer();

/**
 * Normalizes options and evaluates preliminary scheme routing.
 * @private
 * @param {string} url - The URL string.
 * @param {object} opt - User options.
 * @returns {{ options: object, scheme: string|null, earlyResult: string|null|undefined }} Nomalized options, scheme, and earlyResult.
 */
const prepareSanitizeRoute = (url, opt = {}) => {
  if (!url || !isString(url)) {
    return { earlyResult: null };
  }
  const options = {
    ...DEFAULT_OPTS,
    ...opt
  };
  const scheme = urlSanitizer.getScheme(url);
  if (scheme === null) {
    if (options.allowRelative) {
      return { earlyResult: urlSanitizer.sanitize(url, options) };
    }
    return { earlyResult: null };
  }
  return { options, scheme };
};

/**
 * Normalizes an array of scheme strings.
 * Filters out non-string items and trims/lowercases valid schemes.
 * @private
 * @param {string[]} [schemes] - An array of scheme strings to normalize.
 * @returns {string[]} An array of normalized scheme strings, or an empty array if invalid.
 */
const normalizeSchemes = schemes =>
  Array.isArray(schemes)
    ? schemes
        .filter(isString)
        .map(scheme => urlSanitizer.normalize(scheme, true))
        .filter(Boolean)
    : [];

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
export const sanitizeURL = async (url, opt) => {
  const { options, scheme, earlyResult } = prepareSanitizeRoute(url, opt);
  if (earlyResult !== undefined) {
    return earlyResult;
  }
  if (scheme === 'blob') {
    const allow = normalizeSchemes(options.allow);
    const deny = normalizeSchemes(options.deny);
    const only = normalizeSchemes(options.only);
    let sanitizedData = null;
    if (
      (allow.includes('blob') && !deny.includes('blob')) ||
      only.includes('blob')
    ) {
      let fetchedBuffer = null;
      let fetchedMimeType = '';
      try {
        const fetchResult = await fetchBlobAsArrayBuffer(
          url,
          options.maxBlobSize
        );
        fetchedBuffer = fetchResult.buffer;
        fetchedMimeType = fetchResult.mimeType;
      } catch (e) {
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
        sanitizedData = await urlSanitizer.sanitizeBuffer(
          fetchedBuffer,
          fetchedMimeType,
          options
        );
      }
    }
    if (options.revokeObjectURL) {
      URL.revokeObjectURL(url);
    }
    return sanitizedData;
  } else if (scheme === 'data') {
    return urlSanitizer.sanitizeDataURL(url, options);
  }
  return urlSanitizer.sanitize(url, options);
};

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
export const sanitizeURLSync = (url, opt) => {
  const { options, scheme, earlyResult } = prepareSanitizeRoute(url, opt);
  if (earlyResult !== undefined) {
    return earlyResult;
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
 * NOTE: Blob URLs are not revoked after inspection.
 * @param {string} url - The URL string to inspect.
 * @returns {Promise<InspectedURLResult>} A promise resolving to the inspected URL result.
 */
export const inspectURL = async url => {
  if (isString(url)) {
    const parsedURL = urlSanitizer.parse(url, null, true);
    if (parsedURL?.protocol === 'blob:') {
      try {
        const { buffer, mimeType } = await fetchBlobAsArrayBuffer(
          parsedURL.href
        );
        const base64Data = encodeBufferToBase64(buffer);
        const dataURL = `data:${mimeType ? `${mimeType};base64` : 'base64'},${base64Data}`;
        const inspectedURLResult = urlSanitizer.inspect(dataURL);
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
