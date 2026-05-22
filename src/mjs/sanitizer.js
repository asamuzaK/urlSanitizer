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
 * @typedef {object} ParsedURL - object with additional props based on URL API
 * @property {string} input - URL input
 * @property {boolean} valid - is valid URI
 * @property {object} [data] - parsed result of data URL, `null`able
 * @property {string} [data.mime] - MIME type
 * @property {boolean} [data.base64] - is base64 encoded
 * @property {string} [data.data] - data part of the data URL
 * @property {string} [href] - sanitized URL input
 * @property {string} [origin] - scheme, domain and port of the sanitized URL
 * @property {string} [protocol] - protocol scheme of the sanitized URL
 * @property {string} [username] - username specified before the domain name
 * @property {string} [password] - password specified before the domain name
 * @property {string} [host] - domain and port of the sanitized URL
 * @property {string} [hostname] - domain of the sanitized URL
 * @property {string} [port] - port number of the sanitized URL
 * @property {string} [pathname] - path of the sanitized URL
 * @property {string} [search] - query string of the sanitized URL
 * @property {string} [hash] - fragment identifier of the sanitized URL
 */

/**
 * Internal debug logger.
 * @param {boolean} isDebug - Debug flag.
 * @param {string} message - Output message.
 * @param {Error} [error] - Caught error object.
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
  #nest;
  #recurse = new Set();

  /**
   * construct
   */
  constructor() {
    super();
    this.#nest = 0;
  }

  /**
   * helper to register schemes for allow/only options
   * @private
   * @param {string} item - scheme to register
   * @param {string} listName - name of the option list
   * @param {object} ctx - local context for state management
   * @returns {boolean} - true if scheme is acceptable
   */
  #registerScheme(item, listName, ctx) {
    if (!REG_SCRIPT_BLOB.test(item)) {
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
    return false;
  }

  /**
   * replace matched data URLs
   * @param {string} data - data URL
   * @returns {string} - replaced data URL
   */
  replace(data) {
    if (!isString(data)) {
      throw new TypeError(`Expected String but got ${getType(data)}.`);
    }
    let replacedData = data;
    if (REG_DATA_URL.test(replacedData)) {
      const matchedDataUrls = replacedData.matchAll(REG_DATA_URL_G);
      const items = [...matchedDataUrls].reverse();
      for (const item of items) {
        let [dataUrl] = item;
        if (REG_DATA_URL_B64.test(dataUrl)) {
          [dataUrl] = REG_DATA_URL_B64.exec(dataUrl);
        }
        this.#nest++;
        this.#recurse.add(dataUrl);
        let parsedDataUrl;
        try {
          parsedDataUrl = this.sanitize(dataUrl, {
            allow: ['data']
          });
        } finally {
          this.#nest--;
          this.#recurse.delete(dataUrl);
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
   * purify URL encoded DOM
   * @param {string} dom - DOM string
   * @returns {string} - purified DOM string
   */
  purify(dom) {
    if (!isString(dom)) {
      throw new TypeError(`Expected String but got ${getType(dom)}.`);
    }
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
      purifiedDom = this.replace(purifiedDom);
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
   * sanitize URL
   * NOTE: `data` and `file` schemes must be explicitly allowed
   * `blob` URLs should be converted to `data` URLs
   * `javascript` and `vbscript` schemes can not be allowed
   * @param {string} url - URL
   * @param {object} [opt] - options
   * @param {Array.<string>} [opt.allow] - array of allowed schemes
   * @param {Array.<string>} [opt.deny] - array of denied schemes
   * @param {Array.<string>} [opt.only] - array of specific schemes to allow
   * @param {boolean} [opt.allowRelative] - allow relative URLs
   * @param {boolean} [opt.debug] - enable debug mode
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt) {
    if (this.#nest > HEX) {
      throw new Error('Data URLs nested too deeply.');
    }
    const {
      allow, deny, only, allowRelative = false, debug = false
    } = opt ?? {};
    const schemeMap = new Map([
      ['blob', false],
      ['data', false],
      ['file', false],
      ['javascript', false],
      ['vbscript', false]
    ]);
    const tempScheme = new Set();
    const ctx = { schemeMap, tempScheme, debug };
    let restrictScheme = false;
    if (Array.isArray(only) && only.length) {
      const schemes = super.get();
      for (const item of schemes) {
        schemeMap.set(item, false);
      }
      for (let item of only) {
        if (isString(item)) {
          item = item.trim();
          const registered = this.#registerScheme(item, 'only', ctx);
          if (registered && !restrictScheme && schemeMap.has(item)) {
            restrictScheme = schemeMap.get(item);
          }
        }
      }
    } else {
      if (Array.isArray(allow) && allow.length) {
        for (const item of allow) {
          if (isString(item)) {
            this.#registerScheme(item.trim(), 'allow', ctx);
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
        logDebug(debug, 'Failed to parse relative URL.', e);
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
          bool = schemeParts.every(s => schemeMap.get(s));
        } else {
          for (const [key, value] of schemeMap.entries()) {
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
            const msg = 'Failed to parse inner data URL protocol.';
            logDebug(debug, msg, e);
          }
          const containsDataUrl = REG_DATA_URL.test(parsedData);
          if (parsedData !== data || containsDataUrl) {
            if (containsDataUrl) {
              parsedData = this.replace(parsedData);
            }
          }
          if (!mediaType || REG_MIME_DOM.test(mediaType)) {
            parsedData = this.purify(parsedData);
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
      if (tempScheme.size) {
        tempScheme.forEach(item => {
          super.remove(item);
        });
      }
    }
    return sanitizedUrl || null;
  }

  /**
   * parse sanitized URL
   * @param {string} url - URL
   * @param {object} [opt] - options
   * @param {Array.<string>} [opt.allow] - array of allowed schemes
   * @param {Array.<string>} [opt.deny] - array of denied schemes
   * @param {Array.<string>} [opt.only] - array of specific schemes to allow
   * @returns {ParsedURL} - result with additional props based on URL API
   */
  parse(url, opt) {
    if (!isString(url)) {
      throw new TypeError(`Expected String but got ${getType(url)}.`);
    }
    const parsedUrl = new Map([
      ['input', url]
    ]);
    let sanitizedUrl;
    if (this.verify(url)) {
      const { protocol } = new URL(url);
      if (protocol === 'blob:') {
        sanitizedUrl = url;
      } else {
        sanitizedUrl = this.sanitize(url, opt ?? {
          allow: ['data', 'file']
        });
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
   * reset sanitizer
   * @returns {void}
   */
  reset() {
    super.reset();
    this.#nest = 0;
    this.#recurse.clear();
  }
}
export { URLSanitizer };

/* aliases and async wrappers */
/* instance */
const urlSanitizer = new URLSanitizer();

/**
 * sanitize URL async
 * NOTE: `blob`, `data` and `file` schemes must be explicitly allowed
 * given a `blob` URL, returns a sanitized `data` URL
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {Array.<string>} [opt.allow] - array of allowed schemes
 * @param {Array.<string>} [opt.deny] - array of denied schemes
 * @param {Array.<string>} [opt.only] - array of specific schemes to allow
 * @returns {Promise.<?string>} - sanitized URL
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
          res = urlSanitizer.sanitize(data, opt);
        }
      }
      URL.revokeObjectURL(url);
    } else if (scheme || opt.allowRelative) {
      res = urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};

/**
 * sanitize URL sync
 * NOTE: `data` and `file` schemes must be explicitly allowed
 * `blob` scheme returns `null`
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {Array.<string>} [opt.allow] - array of allowed schemes
 * @param {Array.<string>} [opt.deny] - array of denied schemes
 * @param {Array.<string>} [opt.only] - array of specific schemes to allow
 * @returns {?string} - sanitized URL
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
 * parse URL async
 * @param {string} url - URL
 * @returns {Promise.<ParsedURL>} - result
 */
export const parseURL = async url => {
  const res = urlSanitizer.parse(url);
  return res;
};

/**
 * parse URL sync
 * @param {string} url - URL
 * @returns {ParsedURL} - result
 */
export const parseURLSync = url => urlSanitizer.parse(url);

/**
 * is URI async
 * @param {string} uri - URI
 * @returns {Promise.<boolean>} - result
 */
export const isURI = async uri => {
  const res = urlSanitizer.verify(uri);
  return res;
};

/**
 * is URI sync
 * @param {string} uri - URI
 * @returns {boolean} - result
 */
export const isURISync = uri => urlSanitizer.verify(uri);

/* export instance */
export default urlSanitizer;
