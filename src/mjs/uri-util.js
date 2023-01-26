/**
 * uri-util.js
 */

/* shared */
import { getType, isString } from './common.js';
import textCharTable from '../lib/file/text-chars.json' assert { type: 'json' };
import uriSchemes from '../lib/iana/uri-schemes.json' assert { type: 'json' };

/* constants */
const HEX = 16;
const REG_CHARS = /[<>"'\s]/g;
const REG_DATA_URL = /data:[^,]*,[^"]+/g;
const REG_DATA_URL_BASE64 = /data:[^,]*;?base64,[\dA-Za-z+/\-_=]+/;
const REG_DATA_URL_HEADER = /data:[^,]*,/;
const REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/ig;
const REG_SCHEME = /^[a-z][a-z0-9+\-.]*$/;
const REG_SCHEME_CUSTOM = /^(?:ext|web)\+[a-z]+$/;
const REG_SCRIPT = /(?:java|vb)script/;

/**
 * get URL encoded string
 *
 * @param {string} str - string
 * @returns {string} - URL encoded string
 */
export const getUrlEncodedString = str => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  const chars = [];
  for (const ch of str) {
    chars.push(`%${ch.charCodeAt(0).toString(HEX).toUpperCase()}`);
  }
  return chars.join('');
};

/**
 * escape URL encoded HTML special chars
 *
 * @param {string} ch - URL encoded (percent encoded) char
 * @returns {string} - escaped URL encoded HTML special char / URL encoded char
 */
export const escapeUrlEncodedHtmlChars = ch => {
  if (isString(ch)) {
    if (/^%[\dA-F]{2}$/i.test(ch)) {
      ch = ch.toUpperCase();
    } else {
      throw new Error(`${ch} is not a URL encoded character.`);
    }
  } else {
    throw new TypeError(`Expected String but got ${getType(ch)}.`);
  }
  const [amp, num, lt, gt, quot, apos] =
    ['&', '#', '<', '>', '"', "'"].map(getUrlEncodedString);
  let escapedChar;
  if (ch === amp) {
    escapedChar = `${amp}amp;`;
  } else if (ch === lt) {
    escapedChar = `${amp}lt;`;
  } else if (ch === gt) {
    escapedChar = `${amp}gt;`;
  } else if (ch === quot) {
    escapedChar = `${amp}quot;`;
  } else if (ch === apos) {
    escapedChar = `${amp}${num}39;`;
  } else {
    escapedChar = ch;
  }
  return escapedChar;
};

/**
 * parse base64
 *
 * @param {string} data - base64 data
 * @returns {string} - parsed data / base64 data
 */
export const parseBase64 = data => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  }
  const bin = atob(data);
  const uint8arr = Uint8Array.from([...bin].map(c => c.charCodeAt(0)));
  const textChars = new Set(textCharTable);
  let parsedData;
  if (uint8arr.every(c => textChars.has(c))) {
    parsedData = bin.replace(/\s/g, getUrlEncodedString);
  } else {
    parsedData = data;
  }
  return parsedData;
};

/**
 * parse URL encoded numeric character reference
 *
 * @param {string} str - string
 * @returns {string} - parsed string
 */
export const parseUrlEncodedNumCharRef = str => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  let res = decodeURIComponent(str);
  if (/&#/.test(res)) {
    const textChars = new Set(textCharTable);
    const items = [...res.matchAll(REG_NUM_REF)];
    for (const item of items) {
      const [num1, num2] = item;
      let num;
      if (/^[\d]+$/.test(num2)) {
        num = parseInt(num2);
      } else if (num2.startsWith('x')) {
        num = parseInt(`0${num2}`, HEX);
      }
      if (Number.isInteger(num)) {
        if (textChars.has(num)) {
          res = res.replace(num1, String.fromCharCode(num));
        } else if (num < HEX * HEX) {
          res = res.replace(num1, '');
        }
      }
    }
  }
  return res;
};

/**
 * URI schemes
 *
 */
export class URISchemes {
  /* private fields */
  #schemes;

  /**
   * construct
   */
  constructor() {
    this.#schemes = new Set(uriSchemes);
  }

  /**
   * get schemes
   *
   * @see {@link https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml}
   *      - Historical schemes omitted
   *      - 'moz-extension' scheme added
   * @returns {Array.<string>} - array of schemes
   */
  get() {
    return [...this.#schemes];
  }

  /**
   * has scheme
   *
   * @param {string} scheme - scheme
   * @returns {boolean} - result
   */
  has(scheme) {
    return this.#schemes.has(scheme);
  }

  /**
   * add scheme
   * NOTE: `javascript` and/or `vbscript` schemes can not be registered
   *
   * @param {string} scheme - scheme
   * @returns {Array.<string>} - array of schemes
   */
  add(scheme) {
    if (!isString(scheme)) {
      throw new TypeError(`Expected String but got ${getType(scheme)}.`);
    } else if (REG_SCRIPT.test(scheme) || !REG_SCHEME.test(scheme)) {
      throw new Error(`Invalid scheme: ${scheme}`);
    }
    this.#schemes.add(scheme);
    return [...this.#schemes];
  }

  /**
   * remove scheme
   *
   * @param {string} scheme - scheme
   * @returns {boolean} - result
   */
  remove(scheme) {
    return this.#schemes.delete(scheme);
  }

  /**
   * is URI
   *
   * @param {string} uri - URI input
   * @returns {boolean} - result
   */
  isURI(uri) {
    let res;
    if (isString(uri)) {
      try {
        const { protocol } = new URL(uri);
        const scheme = protocol.replace(/:$/, '');
        const schemeParts = scheme.split('+');
        res = (!REG_SCRIPT.test(scheme) && REG_SCHEME_CUSTOM.test(scheme)) ||
              schemeParts.every(s => this.#schemes.has(s));
      } catch (e) {
        res = false;
      }
    }
    return !!res;
  }
}

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
   * sanitize URL
   * NOTE: `data` and/or `file` schemes must be explicitly allowed
   *       `javascript` and/or `vbscript` schemes can not be allowed
   *
   * @param {string} url - URL input
   * @param {object} opt - options
   * @param {Array.<string>} opt.allow - array of allowed schemes
   * @param {Array.<string>} opt.deny - array of denied schemes
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt = { allow: [], deny: [] }) {
    if (this.#nest > HEX) {
      this.#nest = 0;
      throw new Error('The nesting of data URLs is too deep.');
    }
    let sanitizedUrl;
    if (super.isURI(url)) {
      const { allow, deny } = opt ?? {};
      const { hash, href, pathname, protocol, search } = new URL(url);
      const scheme = protocol.replace(/:$/, '');
      const schemeParts = scheme.split('+');
      const schemeMap = new Map([
        ['data', false],
        ['file', false],
        ['javascrpt', false],
        ['vbscript', false]
      ]);
      if (Array.isArray(allow) && allow.length) {
        const items = Object.values(allow);
        for (let item of items) {
          if (isString(item)) {
            item = item.trim();
            if (!REG_SCRIPT.test(item)) {
              schemeMap.set(item, true);
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
      let bool;
      for (const [key, value] of schemeMap.entries()) {
        bool = value || (scheme !== key && schemeParts.every(s => s !== key));
        if (!bool) {
          break;
        }
      }
      if (bool) {
        const [amp, lt, gt, quot, apos] =
          ['&', '<', '>', '"', "'"].map(getUrlEncodedString);
        const regAmp = new RegExp(amp, 'g');
        const regEncodedChars =
          new RegExp(`(${lt}|${gt}|${quot}|${apos})`, 'g');
        let escapeHtml;
        let urlToSanitize = href;
        if (schemeParts.includes('data')) {
          const [header, ...body] = pathname.split(',');
          const data = `${body.join(',')}${search}${hash}`;
          const mediaType = header.split(';');
          let parsedData = data;
          if (mediaType[mediaType.length - 1] === 'base64') {
            mediaType.pop();
            parsedData = parseBase64(data);
          } else {
            try {
              const decodedData = parseUrlEncodedNumCharRef(parsedData);
              const { protocol: dataScheme } = new URL(decodedData.trim());
              const dataSchemeParts = dataScheme.replace(/:$/, '').split('+');
              if (dataSchemeParts.some(s => REG_SCRIPT.test(s))) {
                urlToSanitize = '';
              }
            } catch (e) {
              // fall through
            }
          }
          const containsDataUrl = REG_DATA_URL_HEADER.test(parsedData);
          if (parsedData !== data || containsDataUrl) {
            if (containsDataUrl) {
              const matchedDataUrls = parsedData.matchAll(REG_DATA_URL);
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
                const [beforeDataUrl, afterDataUrl] = [
                  parsedData.substring(0, index),
                  parsedData.substring(index + dataUrl.length)
                ];
                if (parsedDataUrl) {
                  parsedData =
                    `${beforeDataUrl}${parsedDataUrl}${afterDataUrl}`;
                }
              }
              if (this.#recurse.has(url)) {
                this.#recurse.delete(url);
              } else {
                escapeHtml = true;
              }
            } else if (this.#recurse.has(url)) {
              this.#recurse.delete(url);
            } else {
              escapeHtml = true;
            }
            urlToSanitize = `${scheme}:${mediaType.join(';')},${parsedData}`;
          } else if (this.#recurse.has(url)) {
            this.#recurse.delete(url);
          } else {
            escapeHtml = true;
          }
        } else {
          escapeHtml = true;
        }
        if (urlToSanitize) {
          sanitizedUrl = urlToSanitize.replace(REG_CHARS, getUrlEncodedString)
            .replace(regAmp, escapeUrlEncodedHtmlChars);
          if (escapeHtml) {
            sanitizedUrl =
              sanitizedUrl.replace(regEncodedChars, escapeUrlEncodedHtmlChars);
            this.#nest = 0;
          }
        } else {
          sanitizedUrl = urlToSanitize;
          this.#nest = 0;
        }
      }
    }
    return sanitizedUrl || null;
  }
}

/* instance */
const urlSanitizer = new URLSanitizer();

/* aliases and async wrappers */
/**
 * is URI sync
 *
 * @param {string} uri - URI input
 * @returns {boolean} - result
 */
const isUri = uri => urlSanitizer.isURI(uri);

/**
 * is URI async
 *
 * @param {string} uri - URI input
 * @returns {Promise.<boolean>} - result
 */
export const isURI = async uri => {
  const res = await isUri(uri);
  return res;
};

/**
 * sanitize URL sync
 *
 * @param {string} url - URL input
 * @param {object} opt - options
 * @returns {?string} - sanitized URL
 */
const sanitizeUrl = (url, opt) => urlSanitizer.sanitize(url, opt ?? {
  allow: [],
  deny: []
});

/**
 * sanitize URL async
 *
 * @param {string} url - URL input
 * @param {object} opt - options
 * @returns {Promise.<?string>} - sanitized URL
 */
export const sanitizeURL = async (url, opt) => {
  const res = await sanitizeUrl(url, opt);
  return res;
};

/* export instance and aliases */
export {
  urlSanitizer as default,
  isUri as isURISync,
  sanitizeUrl as sanitizeURLSync
};
