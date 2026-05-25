/**
 * sanitizer.js
 */

/* shared */
import { domPurify } from './dompurify.js';
import { getType, isString } from './common.js';
import {
  createDataURLFromBlob, escapeURLEncodedHTMLChars, parseBase64,
  parseURLEncodedNumCharRef, URISchemes
} from './uri-util.js';
import {
  HEX, MAX_BLOB_SIZE, REG_MIME_DOM, REG_SCHEME, REG_SCRIPT, REG_SCRIPT_BLOB,
  REG_TAG_QUOT
} from './constant.js';

/* typedef */
/**
 * A parsed URL object extending the standard URL API.
 * @typedef {object} ParsedURL
 * @property {string} input - The original URL input.
 * @property {boolean} valid - Indicates whether the URI is valid.
 * @property {object} [data] - The parsed result of a data URL, if applicable.
 * @property {string} [data.mime] - The MIME type of the data.
 * @property {boolean} [data.base64] - True if the data is base64-encoded.
 * @property {string} [data.data] - The actual data part of the data URL.
 * @property {string} [href] - The sanitized URL input.
 * @property {string} [origin] - The scheme, the domain and the port.
 * @property {string} [protocol] - The protocol scheme.
 * @property {string} [username] - The specified username.
 * @property {string} [password] - The specified password.
 * @property {string} [host] - The domain and the port.
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
    console.warn(`[URLSanitizer Debug] ${message}`, error ? error.message : '');
  }
};

/**
 * URL sanitizer
 */
class URLSanitizer extends URISchemes {
  /* private fields */
  #allowedSchemes;
  static #activeCtx = null;
  static #activeInstance = null;
  static {
    domPurify.addHook('uponSanitizeAttribute', (node, e) => {
      const ctx = URLSanitizer.#activeCtx;
      const instance = URLSanitizer.#activeInstance;
      if (!ctx || !instance || !e.attrValue) {
        return;
      }
      if (!/^\s*data:/i.test(e.attrValue)) {
        return;
      }
      let urlObj;
      try {
        urlObj = new URL(e.attrValue);
      } catch {
        return;
      }
      if (urlObj.protocol === 'data:') {
        if (!ctx.recurse) {
          ctx.recurse = new Set();
        }
        if (ctx.recurse.has(e.attrValue)) {
          const msg = `Circular Data URL detected and skipped: ${e.attrValue}`;
          logDebug(ctx.debug, msg);
          e.attrValue = '';
          return;
        }
        ctx.nest++;
        ctx.recurse.add(e.attrValue);
        try {
          const sanitized = instance.#process(e.attrValue, {
            allow: ['data'],
            deny: [],
            only: [],
            allowRelative: false
          }, ctx);
          e.attrValue = sanitized || '';
        } finally {
          ctx.nest--;
          ctx.recurse.delete(e.attrValue);
        }
      }
    });
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
   * @param {object} ctx - The context for state management.
   * @param {Set<string>} allowedSchemes - The local set of allowed schemes.
   * @returns {boolean} True if the scheme is successfully registered.
   */
  #registerScheme(item, listName, ctx, allowedSchemes) {
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
    ctx.schemeMap.set(item, true);
    allowedSchemes.add(item);
    return true;
  }

  /**
   * Purifies a URL-encoded DOM string to prevent XSS.
   * @private
   * @param {string} dom - The URL-encoded DOM string.
   * @param {object} ctx - The context for state management.
   * @returns {string} The purified DOM string.
   */
  #purify(dom, ctx) {
    let decodedDom = dom;
    try {
      // prevent URIError caused by malformed percent-encoding
      // e.g., a standalone '%'
      decodedDom = decodeURIComponent(dom);
    } catch (e) {
      // fall through
    }
    let purifiedDom = ctx.domPurify.sanitize(decodedDom);
    purifiedDom = purifiedDom.replace(/(?:#|%23)$/, '')
      .replace(/(?<!(?:#|%23).*)(?:\?|%3F)$/, '');
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
   * @param {object} rules - Normalized sanitization rules (Required).
   * @param {object} ctx - Internal context for state management (Required).
   * @returns {string|null} The sanitized URL, or null.
   */
  #process(url, rules, ctx) {
    if (ctx.nest > HEX) {
      throw new Error('Data URLs nested too deeply.');
    }
    const { allow, deny, only, allowRelative } = rules;
    let allowedSchemes = this.#allowedSchemes;
    let restrictScheme = false;

    if (only.length) {
      allowedSchemes = new Set(this.#allowedSchemes);
      const baseSchemes = this.#allowedSchemes;
      for (const item of baseSchemes) {
        ctx.schemeMap.set(item, false);
      }
      for (let item of only) {
        if (isString(item)) {
          item = item.trim();
          const registered =
            this.#registerScheme(item, 'only', ctx, allowedSchemes);
          if (registered && !restrictScheme && ctx.schemeMap.has(item)) {
            restrictScheme = ctx.schemeMap.get(item);
          }
        }
      }
    } else {
      if (allow.length) {
        allowedSchemes = new Set(this.#allowedSchemes);
        for (const item of allow) {
          if (isString(item)) {
            this.#registerScheme(item.trim(), 'allow', ctx, allowedSchemes);
          }
        }
      }
      if (deny.length) {
        for (let item of deny) {
          if (isString(item)) {
            item = item.trim();
            if (item) {
              ctx.schemeMap.set(item, false);
            }
          }
        }
      }
    }
    let sanitizedUrl;
    let isVerified = super.verify(url, allowedSchemes);
    let isRelative = false;
    let relativeParsedPath = '';
    if (!isVerified && allowRelative) {
      try {
        const dummyUrl = new URL(url, 'http://dummy.local');
        if (
          dummyUrl.protocol === 'http:' &&
          dummyUrl.hostname === 'dummy.local'
        ) {
          isVerified = true;
          isRelative = true;
          relativeParsedPath =
            `${dummyUrl.pathname}${dummyUrl.search}${dummyUrl.hash}`;
        }
      } catch (e) {
        logDebug(ctx.debug, 'Failed to parse relative URL.', e);
      }
    }
    if (isVerified) {
      let hash, href, pathname, protocol, search;
      let scheme = '';
      let schemeParts = [];
      let bool = false;
      if (isRelative) {
        bool = true;
      } else {
        const urlObj = new URL(url);
        ({ hash, href, pathname, protocol, search } = urlObj);
        scheme = protocol.replace(/:$/, '');
        schemeParts = scheme.split('+');
        if (restrictScheme) {
          bool = schemeParts.every(s => ctx.schemeMap.get(s));
        } else {
          for (const [key, value] of ctx.schemeMap.entries()) {
            bool =
            value || (scheme !== key && schemeParts.every(s => s !== key));
            if (!bool) {
              break;
            }
          }
        }
      }
      if (bool) {
        const isDataUrl = isRelative ? false : schemeParts.includes('data');
        let urlToSanitize = isRelative ? relativeParsedPath : href;
        if (isDataUrl) {
          const [mediaType, ...dataParts] = pathname.split(',');
          const data = `${dataParts.join(',')}${search}${hash}`;
          const mediaTypes = mediaType.split(';');
          const isBase64 = mediaTypes[mediaTypes.length - 1] === 'base64';
          let parsedData = data;
          if (isBase64) {
            try {
              parsedData = parseBase64(data);
            } catch (e) {
              logDebug(ctx.debug, 'Failed to parse base64 data.', e);
              urlToSanitize = '';
            }
          }
          try {
            const decodedData = parseURLEncodedNumCharRef(parsedData).trim();
            const { protocol: dataScheme } =
              new URL(decodedData, 'http://dummy.local');
            const dataSchemeParts = dataScheme.replace(/:$/, '').split('+');
            if (dataSchemeParts.some(s => REG_SCRIPT_BLOB.test(s))) {
              urlToSanitize = '';
            }
          } catch (e) {
            const msg = 'Failed to parse inner data URL protocol.';
            logDebug(ctx.debug, msg, e);
          }
          if (!mediaType || REG_MIME_DOM.test(mediaType)) {
            parsedData = this.#purify(parsedData, ctx);
          }
          if (urlToSanitize && parsedData) {
            if (isBase64 && parsedData !== data) {
              mediaTypes.pop();
            }
            urlToSanitize = `${scheme}:${mediaTypes.join(';')},${parsedData}`;
          } else {
            urlToSanitize = '';
          }
        }
        if (!isDataUrl && REG_TAG_QUOT.test(urlToSanitize)) {
          const item = REG_TAG_QUOT.exec(urlToSanitize);
          const { index } = item;
          urlToSanitize =
            urlToSanitize.substring(0, index).replace(/[?&]$/, '');
        }
        if (urlToSanitize) {
          sanitizedUrl =
            urlToSanitize.replace(/%26/g, escapeURLEncodedHTMLChars);
        }
      }
    }
    return sanitizedUrl || null;
  }

  /**
   * Sanitizes the given URL.
   * @param {string} url - The URL string to sanitize.
   * @param {object} [opt] - Sanitization options.
   * @param {string[]} [opt.allow] - An array of schemes to allow.
   * @param {string[]} [opt.deny] - An array of schemes to deny.
   * @param {string[]} [opt.only] - An array of specific schemes to allow.
   * @param {boolean} [opt.allowRelative] - Flag to safely allow relative URLs.
   * @param {boolean} [opt.debug] - Flag to enable debug mode.
   * @param {number} [opt.maxBlobSize] - The maximum allowed blob size in bytes.
   * @returns {string|null} The sanitized URL, or null.
   */

  sanitize(url, opt) {
    if (!url || !isString(url)) {
      return null;
    }
    const hasRestrictiveRules = opt && (
      (Array.isArray(opt.deny) && opt.deny.length > 0) ||
      (Array.isArray(opt.only) && opt.only.length > 0) ||
      opt.allowRelative
    );
    if (
      !hasRestrictiveRules &&
      (url.startsWith('https://') || url.startsWith('http://')) &&
      !REG_TAG_QUOT.test(url) &&
      !url.includes('data:')
    ) {
      try {
        const urlObj = new URL(url);
        let res = urlObj.href;
        if (res.includes('%26')) {
          res = res.replace(/%26/g, escapeURLEncodedHTMLChars);
        }
        return res;
      } catch {
        return null;
      }
    }
    const rules = {
      allow: Array.isArray(opt?.allow) ? opt.allow : [],
      deny: Array.isArray(opt?.deny) ? opt.deny : [],
      only: Array.isArray(opt?.only) ? opt.only : [],
      allowRelative: !!opt?.allowRelative
    };
    const ctx = {
      debug: !!opt?.debug,
      domPurify,
      nest: 0,
      recurse: null,
      schemeMap: new Map([
        ['blob', false],
        ['data', false],
        ['file', false],
        ['javascript', false],
        ['vbscript', false]
      ])
    };
    const prevCtx = URLSanitizer.#activeCtx;
    const prevInstance = URLSanitizer.#activeInstance;
    URLSanitizer.#activeCtx = ctx;
    URLSanitizer.#activeInstance = this;
    try {
      return this.#process(url, rules, ctx);
    } finally {
      URLSanitizer.#activeCtx = prevCtx;
      URLSanitizer.#activeInstance = prevInstance;
    }
  }

  /**
   * Parses the given URL with sanitization.
   * NOTE: blob URLs are simply parsed, but neither decoded nor sanitized.
   * @param {string} url - The URL string to parse.
   * @param {object} [opt] - Sanitization options.
   * @returns {ParsedURL} The object containing parsed result.
   */
  parse(url, opt) {
    if (!isString(url)) {
      throw new TypeError(`Expected String but got ${getType(url)}.`);
    }
    const parsedUrl = new Map([['input', url]]);
    let sanitizedUrl;
    if (this.verify(url)) {
      const { protocol } = new URL(url);
      if (protocol === 'blob:') {
        sanitizedUrl = url;
      } else {
        sanitizedUrl = this.sanitize(url, opt ?? { allow: ['data', 'file'] });
      }
    }
    if (sanitizedUrl) {
      const urlObj = new URL(sanitizedUrl);
      const { pathname, protocol } = urlObj;
      const schemeParts = protocol.replace(/:$/, '').split('+');
      const isDataUrl = schemeParts.includes('data');
      parsedUrl.set('valid', true);
      if (isDataUrl) {
        const dataUrl = new Map();
        const [mediaType, ...dataParts] = pathname.split(',');
        const data = `${dataParts.join(',')}`;
        const mediaTypes = mediaType.split(';');
        const isBase64 = mediaTypes[mediaTypes.length - 1] === 'base64';
        if (isBase64) {
          mediaTypes.pop();
        }
        dataUrl.set('mime', mediaTypes.join(';'));
        dataUrl.set('base64', isBase64);
        dataUrl.set('data', data);
        parsedUrl.set('data', Object.fromEntries(dataUrl));
      } else {
        parsedUrl.set('data', null);
      }
      for (const key in urlObj) {
        const value = urlObj[key];
        if (isString(value)) {
          parsedUrl.set(key, value);
        }
      }
    } else {
      parsedUrl.set('valid', false);
    }
    return Object.fromEntries(parsedUrl);
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
    return this.#allowedSchemes.has(scheme);
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
    const schemeParts = scheme.split('+');
    const isScript = schemeParts.some(s => REG_SCRIPT.test(s));
    if (isScript || !REG_SCHEME.test(scheme)) {
      throw new Error(`Invalid scheme: ${scheme}`);
    }
    this.#allowedSchemes.add(scheme);
    return [...this.#allowedSchemes];
  }

  /**
   * Removes a scheme from the allowed list.
   * @param {string} scheme - The scheme to remove.
   * @returns {boolean} True if the scheme was successfully removed.
   */
  remove(scheme) {
    return this.#allowedSchemes.delete(scheme);
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
  verify(uri, schemes = this.#allowedSchemes) {
    return super.verify(uri, schemes);
  }
}
export { URLSanitizer };

/* instance */
const urlSanitizer = new URLSanitizer();

/**
 * Asynchronously sanitizes the given URL.
 * NOTE: `blob`, `data`, and `file` schemes must be explicitly allowed.
 * Given a `blob` URL, it securely converts and returns a sanitized `data` URL.
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {Array.<string>} [opt.allow] - The array of schemes to allow.
 * @param {Array.<string>} [opt.deny] - The array of schemes to deny.
 * @param {Array.<string>} [opt.only] - The array of specific schemes to allow.
 * @param {boolean} [opt.allowRelative] - Allow relative URLs.
 * @param {boolean} [opt.debug] - Enable debug mode.
 * @param {boolean} [opt.revokeObjectURL] - Revokes the blob URL after sanitization.
 * @param {number} [opt.maxBlobSize] - The maximum allowed blob size in bytes.
 * @returns {Promise<string|null>} A promise resolving to the sanitized URL, or null.
 */
export const sanitizeURL = async (url, opt = {
  allow: [],
  deny: [],
  only: [],
  allowRelative: false,
  debug: false,
  revokeObjectURL: false,
  maxBlobSize: MAX_BLOB_SIZE
}) => {
  const isDebug = !!opt?.debug;
  const maxBlobSize = Number.isInteger(opt?.maxBlobSize) && opt.maxBlobSize > 0
    ? opt.maxBlobSize
    : MAX_BLOB_SIZE;
  let res;
  if (url && isString(url)) {
    let scheme;
    try {
      const { protocol } = new URL(url);
      scheme = protocol.replace(/:$/, '');
    } catch (e) {
      logDebug(isDebug, `Invalid URL input format: ${url}`, e);
    }
    if (scheme === 'blob') {
      const { allow, deny, only } = opt;
      if ((Array.isArray(allow) && allow.includes('blob') &&
           !(Array.isArray(deny) && deny.includes('blob'))) ||
          (Array.isArray(only) && only.includes('blob'))) {
        let data;
        try {
          data = await fetch(url)
            .then(r => r.blob())
            .then(b => createDataURLFromBlob(b, maxBlobSize));
        } catch (e) {
          const msg = `Failed to fetch and convert blob URL: ${url}`;
          logDebug(isDebug, msg, e);
        }
        if (data) {
          const options = { ...opt };
          if (Array.isArray(opt.only)) {
            options.only = opt.only.includes('data')
              ? opt.only
              : [...opt.only, 'data'];
          } else if (Array.isArray(opt.allow)) {
            options.allow = opt.allow.includes('data')
              ? opt.allow
              : [...opt.allow, 'data'];
            if (Array.isArray(opt.deny)) {
              options.deny = opt.deny.filter(scheme => scheme !== 'data');
            }
          }
          res = await urlSanitizer.sanitize(data, options);
        }
      }
      if (opt?.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
    } else if (scheme || opt.allowRelative) {
      res = await urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};

/**
 * Synchronously sanitizes the given URL.
 * NOTE: `data` and `file` schemes must be explicitly allowed.
 * The `blob` scheme is not supported and will return `null`.
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {Array.<string>} [opt.allow] - The array of schemes to allow.
 * @param {Array.<string>} [opt.deny] - The array of schemes to deny.
 * @param {Array.<string>} [opt.only] - The array of specific schemes to allow.
 * @param {boolean} [opt.allowRelative] - Allow relative URLs.
 * @param {boolean} [opt.debug] - Enable debug mode.
 * @param {boolean} [opt.revokeObjectURL] - Revokes the blob URL.
 * @returns {string|null} The sanitized URL, or null if denied.
 */
export const sanitizeURLSync = (url, opt = {
  allow: [],
  deny: [],
  only: [],
  allowRelative: false,
  debug: false,
  revokeObjectURL: false
}) => {
  const isDebug = !!opt?.debug;
  let res;
  if (url && isString(url)) {
    let scheme;
    try {
      const { protocol } = new URL(url);
      scheme = protocol.replace(/:$/, '');
    } catch (e) {
      const msg = `Invalid URL input format: ${url}`;
      logDebug(isDebug, msg, e);
    }
    if (scheme === 'blob') {
      if (opt?.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
      return null;
    } else if (scheme || opt.allowRelative) {
      res = urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};

/**
 * Asynchronously parses the given URL.
 * @param {string} url - The URL string to parse.
 * @returns {Promise<ParsedURL>} A promise resolving to the parsed URL object.
 */
export const parseURL = async url => {
  const res = await urlSanitizer.parse(url);
  return res;
};

/**
 * Synchronously parses the given URL.
 * @param {string} url - The URL string to parse.
 * @returns {ParsedURL} The parsed URL object.
 */
export const parseURLSync = url => urlSanitizer.parse(url);

/**
 * Asynchronously checks if the given string is a valid URI and is registered.
 * @param {string} uri - The URI string to verify.
 * @returns {Promise<boolean>} True if valid and registered, false otherwise.
 */
export const isURI = async uri => {
  const res = await urlSanitizer.verify(uri);
  return res;
};

/**
 * Synchronously checks if the given string is a valid URI and is registered.
 * @param {string} uri - The URI string to verify.
 * @returns {boolean} True if valid and registered, false otherwise.
 */
export const isURISync = uri => urlSanitizer.verify(uri);

/* export instance */
export default urlSanitizer;
