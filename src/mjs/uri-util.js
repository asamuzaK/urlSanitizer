/**
 * uri-util.js
 */

/* shared */
import { getType, isString } from './common.js';
import uriSchemes from '../lib/iana/uri-schemes.json' assert { type: 'json' };

/* constants */
const HEX = 16;

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
 * @see {@link https://github.com/file/file/blob/master/src/encoding.c}
 * @param {string} data - base64 data
 * @returns {string} - parsed data / base64 data
 */
export const parseBase64 = data => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  }
  const bin = atob(data);
  const uint8arr = Uint8Array.from([...bin].map(c => c.charCodeAt(0)));
  const textChars = new Set([0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1b]);
  for (let i = 0x20; i < 0x7f; i++) {
    textChars.add(i);
  }
  for (let i = 0x80; i <= 0xff; i++) {
    textChars.add(i);
  }
  let parsedData;
  if (uint8arr.every(c => textChars.has(c))) {
    parsedData = bin.replace(/\s/g, getUrlEncodedString);
  } else {
    parsedData = data;
  }
  return parsedData;
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
    } else if (/(?:java|vb)script/.test(scheme) ||
               !/^[a-z][a-z0-9+\-.]*$/.test(scheme)) {
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
        res = /^(?:ext|web)\+[a-z]+$/.test(scheme) ||
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
  /**
   * sanitize URL
   * NOTE: `data` and/or `file` schemes must be explicitly allowed
   *       `javascript` and/or `vbscript` schemes can not be allowed
   *
   * @param {string} url - URL input
   * @param {object} opt - options
   * @param {Array.<string>} opt.allow - array of allowed schemes
   * @param {Array.<string>} opt.deny - array of denied schemes
   * @param {boolean} opt.escapeTags - escape tags and quotes in data URL
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt = { allow: [], deny: [], escapeTags: true }) {
    let sanitizedUrl;
    if (super.isURI(url)) {
      const { allow, deny, escapeTags } = opt ?? {};
      const { href, pathname, protocol } = new URL(url);
      const scheme = protocol.replace(/:$/, '');
      const schemeParts = scheme.split('+');
      const schemeMap = new Map([['data', false], ['file', false]]);
      if (Array.isArray(allow) && allow.length) {
        const items = Object.values(allow);
        for (let item of items) {
          if (isString(item)) {
            item = item.trim();
            if (/(?:java|vb)script/.test(item)) {
              schemeMap.set(item, false);
            } else if (item) {
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
        const regChars = /[<>"']/g;
        const regAmp = new RegExp(amp, 'g');
        const regEncodedChars =
          new RegExp(`(${lt}|${gt}|${quot}|${apos})`, 'g');
        let type;
        let urlToSanitize = href;
        if (schemeParts.includes('data')) {
          const [header, data] = pathname.split(',');
          const mediaType = header.split(';');
          const isBase64 = mediaType.pop() === 'base64';
          if (isBase64) {
            let parsedData = parseBase64(data);
            if (parsedData !== data) {
              const regDataUrl = /data:[^,]*;?base64,[\dA-Za-z+/\-_=]+/g;
              if (regDataUrl.test(parsedData)) {
                const dataUrlArr = [];
                let arr = regDataUrl.exec(parsedData);
                do {
                  if (arr) {
                    dataUrlArr.push(arr);
                  }
                } while ((arr = regDataUrl.exec(parsedData)));
                if (dataUrlArr.length) {
                  for (const i of dataUrlArr) {
                    const [dataUrl] = i;
                    const parsedDataUrl = this.sanitize(dataUrl, {
                      allow: ['data']
                    });
                    if (parsedDataUrl) {
                      parsedData = parsedData.replace(dataUrl, parsedDataUrl);
                    }
                    type = 0;
                  }
                }
              } else if (/data:[^,]*,/.test(parsedData) &&
                         !(escapeTags ?? true)) {
                const dataArr = parsedData.split(/data:[^,]*,/);
                const l = dataArr.length;
                let i = 1;
                while (i < l) {
                  const dataItem = dataArr[i]
                    .replace(regEncodedChars, escapeUrlEncodedHtmlChars);
                  parsedData = parsedData.replace(dataArr[i], dataItem);
                  i++;
                }
                type = 0;
              }
              urlToSanitize = `${scheme}:${mediaType.join(';')},${parsedData}`;
              if ((escapeTags ?? true)) {
                type = 1;
              } else if (!Number.isInteger(type)) {
                type = 2;
              }
            } else if ((escapeTags ?? true)) {
              type = 1;
            } else {
              type = 2;
            }
          } else if ((escapeTags ?? true)) {
            type = 1;
          } else {
            type = 2;
          }
        } else {
          type = 1;
        }
        switch (type) {
          case 1:
            sanitizedUrl = urlToSanitize.replace(regChars, getUrlEncodedString)
              .replace(regAmp, escapeUrlEncodedHtmlChars)
              .replace(regEncodedChars, escapeUrlEncodedHtmlChars);
            break;
          case 2:
            sanitizedUrl = urlToSanitize.replace(regChars, getUrlEncodedString)
              .replace(regAmp, escapeUrlEncodedHtmlChars);
            break;
          case 0:
          default:
            sanitizedUrl = urlToSanitize.replace(regChars, getUrlEncodedString);
        }
      }
    }
    return sanitizedUrl || null;
  }
}

const urlSanitizer = new URLSanitizer();

/* alias */
/**
 * is URI sync
 *
 * @param {string} uri - URI input
 * @returns {boolean} - result
 */
const isUri = uri => urlSanitizer.isURI(uri);

/**
 * is URI
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
  deny: [],
  escapeTags: true
});

/**
 * sanitize URL
 *
 * @param {string} url - URL input
 * @param {object} opt - options
 * @returns {Promise<?string>} - sanitized URL
 */
export const sanitizeURL = async (url, opt) => {
  const res = await sanitizeUrl(url, opt);
  return res;
};

export {
  urlSanitizer as default,
  isUri as isURISync,
  sanitizeUrl as sanitizeURLSync
};
