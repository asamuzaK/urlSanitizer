/**
 * sanitizer.js
 */

/* shared */
import domPurify from './dompurify.js';
import { getType, isString } from './common.js';
import {
  createDataURLFromBlob, escapeURLEncodedHTMLChars, getURLEncodedString,
  parseBase64, parseURLEncodedNumCharRef, URISchemes
} from './uri-util.js';

/* constants */
const HEX = 16;
const REG_DATA_URL = /data:[\w#&+\-./;=]*,/;
const REG_DATA_URL_BASE64 = /data:[\w#&+\-./;=]*base64,[\w+/\-=]+/i;
const REG_DATA_URL_G = /data:[\w#&+\-./;=]*,[^"]+/g;
const REG_END_COLON = /:$/;
const REG_END_NUM = /(?:#|%23)$/;
const REG_END_QUEST = /(?<!(?:#|%23).*)(?:\?|%3F)$/;
const REG_HTML_SP = /[<>"'\s]/g;
const REG_HTML_URL_ENC = /%(?:2(?:2|7)|3(?:C|E))/g;
const REG_MIME_DOM =
  /^(?:text\/(?:ht|x)ml|application\/(?:[\w#&\-.;]+\+)?xml|image\/svg\+xml)/;
const REG_SCRIPT_BLOB = /(?:java|vb)script|blob/;
const REG_TAG_QUOT = /%(?:2(?:2|7)|3(?:C|E))|[<>"']/;
const REG_URL_ENC_AMP = /%26/g;

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
 * @property {string} [protocol] -  protocol scheme of the sanitized URL
 * @property {string} [username] - username specified before the domain name
 * @property {string} [password] - password specified before the domain name
 * @property {string} [host] - domain and port of the sanitized URL
 * @property {string} [hostname] - domain of the sanitized URL
 * @property {string} [port] - port number of the sanitized URL
 * @property {string} [pathname] - path of the sanitized URL
 * @property {string} [search] - query string of the sanitized URL
 * @property {string} [hash] - fragment identifier of the sanitized URL
 */

/* URL sanitizer */
export class URLSanitizer extends URISchemes {
  /* private fields */
  #nest;
  #recurse;

  /**
   * construct
   */
  constructor() {
    super();
    this.#nest = 0;
    this.#recurse = new Set();
  }

  /**
   * replace matched data URLs
   *
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
        if (REG_DATA_URL_BASE64.test(dataUrl)) {
          [dataUrl] = REG_DATA_URL_BASE64.exec(dataUrl);
        }
        this.#nest++;
        this.#recurse.add(dataUrl);
        const parsedDataUrl = this.sanitize(dataUrl, {
          allow: ['data']
        });
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
   *
   * @param {string} dom - DOM string
   * @returns {string} - purified DOM string
   */
  purify(dom) {
    if (!isString(dom)) {
      throw new TypeError(`Expected String but got ${getType(dom)}.`);
    }
    let purifiedDom = domPurify.sanitize(decodeURIComponent(dom));
    if (purifiedDom && REG_DATA_URL.test(purifiedDom)) {
      purifiedDom = this.replace(purifiedDom);
    }
    purifiedDom =
      purifiedDom.replace(REG_END_NUM, '').replace(REG_END_QUEST, '');
    return encodeURI(purifiedDom);
  };

  /**
   * sanitize URL
   * NOTE: `data` and `file` schemes must be explicitly allowed
   *       `blob` URLs should be converted to `data` URLs
   *       `javascript` and `vbscript` schemes can not be allowed
   *
   * @param {string} url - URL
   * @param {object} [opt] - options
   * @param {Array.<string>} [opt.allow] - array of allowed schemes
   * @param {Array.<string>} [opt.deny] - array of denied schemes
   * @param {Array.<string>} [opt.only] - array of specific schemes to allow
   * @param {boolean} [opt.remove] - remove tag and/or quote and the rest
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt) {
    if (this.#nest > HEX) {
      this.#nest = 0;
      throw new Error('Data URLs nested too deeply.');
    }
    const { allow, deny, only, remove } = opt ?? {};
    const schemeMap = new Map([
      ['blob', false],
      ['data', false],
      ['file', false],
      ['javascrpt', false],
      ['vbscript', false]
    ]);
    let restrictScheme = false;
    if (Array.isArray(only) && only.length) {
      const schemes = super.get();
      for (const item of schemes) {
        schemeMap.set(item, false);
      }
      const items = Object.values(only);
      for (let item of items) {
        if (isString(item)) {
          item = item.trim();
          if (!REG_SCRIPT_BLOB.test(item)) {
            if (super.has(item)) {
              schemeMap.set(item, true);
            } else {
              try {
                super.add(item);
              } catch (e) {
                // fall through
              }
              if (super.has(item)) {
                schemeMap.set(item, true);
              }
            }
            if (!restrictScheme && schemeMap.has(item)) {
              restrictScheme = schemeMap.get(item);
            }
          }
        }
      }
    } else {
      if (Array.isArray(allow) && allow.length) {
        const items = Object.values(allow);
        for (let item of items) {
          if (isString(item)) {
            item = item.trim();
            if (!REG_SCRIPT_BLOB.test(item)) {
              if (super.has(item)) {
                schemeMap.set(item, true);
              } else {
                try {
                  super.add(item);
                } catch (e) {
                  // fall through
                }
                if (super.has(item)) {
                  schemeMap.set(item, true);
                }
              }
            }
          }
        }
      }
      if (Array.isArray(deny) && deny.length) {
        const items = Object.values(deny);
        for (let item of items) {
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
    if (super.verify(url)) {
      const { hash, href, pathname, protocol, search } = new URL(url);
      const scheme = protocol.replace(REG_END_COLON, '');
      const schemeParts = scheme.split('+');
      let bool;
      if (restrictScheme) {
        bool = schemeParts.every(s => schemeMap.get(s));
      } else {
        for (const [key, value] of schemeMap.entries()) {
          bool = value || (scheme !== key && schemeParts.every(s => s !== key));
          if (!bool) {
            break;
          }
        }
      }
      if (bool) {
        const isDataUrl = schemeParts.includes('data');
        let finalize;
        let urlToSanitize = href;
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
            const dataSchemeParts =
              dataScheme.replace(REG_END_COLON, '').split('+');
            if (dataSchemeParts.some(s => REG_SCRIPT_BLOB.test(s))) {
              urlToSanitize = '';
            }
          } catch (e) {
            // fall through
          }
          const containsDataUrl = REG_DATA_URL.test(parsedData);
          if (parsedData !== data || containsDataUrl) {
            if (containsDataUrl) {
              parsedData = this.replace(parsedData);
            } else if (this.#recurse.has(url)) {
              this.#recurse.delete(url);
            } else {
              finalize = true;
            }
          } else if (this.#recurse.has(url)) {
            this.#recurse.delete(url);
          } else {
            finalize = true;
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
        } else {
          finalize = true;
        }
        if (!isDataUrl && remove && REG_TAG_QUOT.test(urlToSanitize)) {
          const item = REG_TAG_QUOT.exec(urlToSanitize);
          const { index } = item;
          urlToSanitize = urlToSanitize.substring(0, index);
        }
        if (urlToSanitize) {
          sanitizedUrl = urlToSanitize
            .replace(REG_HTML_SP, getURLEncodedString)
            .replace(REG_URL_ENC_AMP, escapeURLEncodedHTMLChars);
          if (finalize) {
            if (!isDataUrl) {
              sanitizedUrl = sanitizedUrl
                .replace(REG_HTML_URL_ENC, escapeURLEncodedHTMLChars);
            }
            this.#nest = 0;
          }
        } else {
          this.#nest = 0;
        }
      }
    }
    return sanitizedUrl || null;
  }

  /**
   * parse sanitized URL
   *
   * @param {string} url - URL
   * @param {object} [opt] - options
   * @param {Array.<string>} [opt.allow] - array of allowed schemes
   * @param {Array.<string>} [opt.deny] - array of denied schemes
   * @param {Array.<string>} [opt.only] - array of specific schemes to allow
   * @param {boolean} [opt.remove] - remove tag and/or quote and the rest
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
      const schemeParts = protocol.replace(REG_END_COLON, '').split('+');
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
   *
   * @returns {void}
   */
  reset() {
    super.reset();
    this.#nest = 0;
    this.#recurse.clear();
  }
};

/* aliases and async wrappers */
/* instance */
const urlSanitizer = new URLSanitizer();

/**
 * sanitize URL async
 * NOTE: `blob`, `data` and `file` schemes must be explicitly allowed
 *       given a `blob` URL, returns a sanitized `data` URL
 *
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {Array.<string>} [opt.allow] - array of allowed schemes
 * @param {Array.<string>} [opt.deny] - array of denied schemes
 * @param {Array.<string>} [opt.only] - array of specific schemes to allow
 * @param {boolean} [opt.remove] - remove tag and/or quote and the rest
 * @returns {Promise.<?string>} - sanitized URL
 */
export const sanitizeURL = async (url, opt = {
  allow: [],
  deny: [],
  only: []
}) => {
  let res;
  if (urlSanitizer.verify(url)) {
    const { protocol } = new URL(url);
    if (protocol === 'blob:') {
      const { allow, deny, only } = opt;
      if ((Array.isArray(allow) && allow.includes('blob') &&
           !(Array.isArray(deny) && deny.includes('blob'))) ||
          (Array.isArray(only) && only.includes('blob'))) {
        let data;
        try {
          data =
            await fetch(url).then(r => r.blob()).then(createDataURLFromBlob);
        } catch (e) {
          // fall through
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
    } else {
      res = urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};

/**
 * sanitize URL sync
 * NOTE: `data` and `file` schemes must be explicitly allowed
 *       `blob` scheme returns `null`
 *
 * @param {string} url - URL
 * @param {object} [opt] - options
 * @param {Array.<string>} [opt.allow] - array of allowed schemes
 * @param {Array.<string>} [opt.deny] - array of denied schemes
 * @param {Array.<string>} [opt.only] - array of specific schemes to allow
 * @param {boolean} [opt.remove] - remove tag and/or quote and the rest
 * @returns {?string} - sanitized URL
 */
export const sanitizeURLSync = (url, opt) => {
  let res;
  if (urlSanitizer.verify(url)) {
    const { protocol } = new URL(url);
    if (protocol === 'blob:') {
      URL.revokeObjectURL(url);
    } else {
      res = urlSanitizer.sanitize(url, opt);
    }
  }
  return res || null;
};

/**
 * parse URL async
 *
 * @param {string} url - URL
 * @returns {Promise.<ParsedURL>} - result
 */
export const parseURL = async url => {
  const res = urlSanitizer.parse(url);
  return res;
};

/**
 * parse URL sync
 *
 * @param {string} url - URL
 * @returns {ParsedURL} - result
 */
export const parseURLSync = url => urlSanitizer.parse(url);

/**
 * is URI async
 *
 * @param {string} uri - URI
 * @returns {Promise.<boolean>} - result
 */
export const isURI = async uri => {
  const res = urlSanitizer.verify(uri);
  return res;
};

/**
 * is URI sync
 *
 * @param {string} uri - URI
 * @returns {boolean} - result
 */
export const isURISync = uri => urlSanitizer.verify(uri);

/* export instance */
export {
  urlSanitizer as default
};
