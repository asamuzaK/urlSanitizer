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
  HEX, MAX_BLOB_SIZE, REG_DATA_URL, REG_DATA_URL_B64, REG_DATA_URL_G,
  REG_MIME_DOM, REG_SCRIPT_BLOB, REG_TAG_QUOT
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
  /**
   * Helper method to register schemes for the 'allow' or 'only' options.
   * @private
   * @param {string} item - The scheme to register.
   * @param {string} listName - The name of the target option list.
   * @param {object} ctx - The context for state management.
   * @returns {boolean} True if the scheme is successfully registered.
   */
  #registerScheme(item, listName, ctx) {
    if (REG_SCRIPT_BLOB.test(item)) {
      return false;
    }
    if (super.has(item)) {
      ctx.schemeMap.set(item, true);
    } else {
      try {
        super.add(item);
      } catch (e) {
        const msg = `Failed to add scheme '${item}' in '${listName}' list.`;
        logDebug(ctx.debug, msg, e);
      }
      if (super.has(item)) {
        ctx.schemeMap.set(item, true);
        ctx.tempScheme.add(item);
      }
    }
    return true;
  }

  /**
   * Replaces matched data URLs within a string with their sanitized versions.
   * @private
   * @param {string} data - The string containing data URLs.
   * @param {object} ctx - The context for state management.
   * @returns {string} The string with sanitized data URLs.
   */
  #replace(data, ctx) {
    let replacedData = data;
    if (REG_DATA_URL.test(replacedData)) {
      const matchedDataUrls = replacedData.matchAll(REG_DATA_URL_G);
      const items = [...matchedDataUrls].reverse();
      for (const item of items) {
        let [dataUrl] = item;
        if (REG_DATA_URL_B64.test(dataUrl)) {
          [dataUrl] = REG_DATA_URL_B64.exec(dataUrl);
        }
        if (ctx.recurse.has(dataUrl)) {
          logDebug(ctx.debug, `Circular Data URL detected and skipped: ${dataUrl}`);
          continue;
        }
        ctx.nest++;
        ctx.recurse.add(dataUrl);
        let parsedDataUrl;
        try {
          parsedDataUrl = this.#process(dataUrl, {
            allow: ['data'],
            deny: [],
            only: [],
            allowRelative: false
          }, ctx);
        } finally {
          ctx.nest--;
          ctx.recurse.delete(dataUrl);
        }
        const { index } = item;
        const [preDataUrl, postDataUrl] = [
          replacedData.substring(0, index),
          replacedData.substring(index + dataUrl.length)
        ];
        if (parsedDataUrl) {
          replacedData = `${preDataUrl}${parsedDataUrl}${postDataUrl}`;
        } else {
          replacedData = `${preDataUrl}${postDataUrl}`;
        }
      }
    }
    return replacedData;
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
    let purifiedDom = domPurify.sanitize(decodedDom);
    if (purifiedDom && REG_DATA_URL.test(purifiedDom)) {
      purifiedDom = this.#replace(purifiedDom, ctx);
    }
    purifiedDom = purifiedDom.replace(/(?:#|%23)$/, '')
      .replace(/(?<!(?:#|%23).*)(?:\?|%3F)$/, '');
    try {
      // prevent URIError caused by lone surrogates
      return encodeURI(purifiedDom);
    } catch (e) {
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
    let restrictScheme = false;
    if (only.length) {
      const schemes = super.get();
      for (const item of schemes) {
        ctx.schemeMap.set(item, false);
      }
      for (let item of only) {
        if (isString(item)) {
          item = item.trim();
          const registered = this.#registerScheme(item, 'only', ctx);
          if (registered && !restrictScheme && ctx.schemeMap.has(item)) {
            restrictScheme = ctx.schemeMap.get(item);
          }
        }
      }
    } else {
      if (allow.length) {
        for (const item of allow) {
          if (isString(item)) {
            this.#registerScheme(item.trim(), 'allow', ctx);
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
    let isVerified = super.verify(url);
    let isRelative = false;
    if (!isVerified && allowRelative) {
      try {
        const { hostname, protocol } = new URL(url, 'http://dummy.local');
        if (protocol === 'http:' && hostname === 'dummy.local') {
          isVerified = true;
          isRelative = true;
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
        let urlToSanitize = isRelative ? url : href;
        if (isDataUrl) {
          const [mediaType, ...dataParts] = pathname.split(',');
          const data = `${dataParts.join(',')}${search}${hash}`;
          const mediaTypes = mediaType.split(';');
          const isBase64 = mediaTypes[mediaTypes.length - 1] === 'base64';
          let parsedData = data;
          if (isBase64) {
            parsedData = parseBase64(data);
          }
          try {
            const decodedData = parseURLEncodedNumCharRef(parsedData).trim();
            const { protocol: dataScheme } = new URL(decodedData);
            const dataSchemeParts = dataScheme.replace(/:$/, '').split('+');
            if (dataSchemeParts.some(s => REG_SCRIPT_BLOB.test(s))) {
              urlToSanitize = '';
            }
          } catch (e) {
            logDebug(ctx.debug, 'Failed to parse inner data URL protocol.', e);
          }
          const containsDataUrl = REG_DATA_URL.test(parsedData);
          if (parsedData !== data || containsDataUrl) {
            if (containsDataUrl) {
              parsedData = this.#replace(parsedData, ctx);
            }
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
      if (ctx.tempScheme.size) {
        ctx.tempScheme.forEach(item => {
          super.remove(item);
        });
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
    const rules = {
      allow: Array.isArray(opt?.allow) ? opt.allow : [],
      deny: Array.isArray(opt?.deny) ? opt.deny : [],
      only: Array.isArray(opt?.only) ? opt.only : [],
      allowRelative: !!opt?.allowRelative
    };
    const ctx = {
      schemeMap: new Map([
        ['blob', false],
        ['data', false],
        ['file', false],
        ['javascript', false],
        ['vbscript', false]
      ]),
      tempScheme: new Set(),
      nest: 0,
      recurse: new Set(),
      debug: !!opt?.debug
    };
    return this.#process(url, rules, ctx);
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
   * Resets the sanitizer state and cleared allowed schemes back to defaults.
   * @returns {void}
   */
  reset() {
    super.reset();
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
 * @param {number} [opt.maxBlobSize] - The maximum allowed blob size in bytes.
 * @returns {Promise<string|null>} A promise resolving to the sanitized URL, or null.
 */
export const sanitizeURL = async (url, opt = {
  allow: [],
  deny: [],
  only: [],
  allowRelative: false,
  debug: false,
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
          if (Array.isArray(only)) {
            if (!only.includes('data')) {
              only.push('data');
            }
          } else if (Array.isArray(allow)) {
            if (!allow.includes('data')) {
              allow.push('data');
            }
            if (Array.isArray(deny) && deny.includes('data')) {
              const i = deny.indexOf('data');
              deny.splice(i, 1);
            }
          }
          res = await urlSanitizer.sanitize(data, opt);
        }
      }
      URL.revokeObjectURL(url);
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
 * @returns {string|null} The sanitized URL, or null if denied.
 */
export const sanitizeURLSync = (url, opt) => {
  let res;
  if (url && isString(url)) {
    let scheme;
    try {
      const { protocol } = new URL(url);
      scheme = protocol.replace(/:$/, '');
    } catch (e) {
      const msg = `Failed to parse URL: ${url}`;
      logDebug(opt?.debug, msg, e);
    }
    if (scheme === 'blob') {
      URL.revokeObjectURL(url);
    } else if (scheme || opt?.allowRelative) {
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
