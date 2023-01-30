/**
 * uri-util.js
 */

/* shared */
import { getType, isString } from './common.js';
import domPurify from './dompurify.js';
import textChars from '../lib/file/text-chars.json' assert { type: 'json' };
import uriSchemes from '../lib/iana/uri-schemes.json' assert { type: 'json' };

/* constants */
const HEX = 16;
const REG_BASE64 = /^[\da-z+/\-_=]+$/i;
const REG_DATA_URL = /data:[^,]*,[^"]+/g;
const REG_DATA_URL_BASE64 = /data:[^,]*;?base64,[\da-z+/\-_=]+/i;
const REG_MIME_DOM =
  /^(?:text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml)/;
const REG_HTML_SP = /[<>"'\s]/g;
const REG_HTML_SP_URL_ENC = /%(?:2(?:2|7)|3(?:C|E))/g;
const REG_NUM_REF = /&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/ig;
const REG_SCHEME = /^[a-z][\da-z+\-.]*$/;
const REG_SCHEME_CUSTOM = /^(?:ext|web)\+[a-z]+$/;
const REG_SCRIPT = /(?:java|vb)script/;
const REG_URL_ENC = /^%[\dA-F]{2}$/i;
const REG_URL_ENC_AMP = /%26/g;
const REG_URL_ENC_HTML_SP = /%26(?:(?:l|g|quo)t|%2339);?/g;

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
    if (REG_URL_ENC.test(ch)) {
      ch = ch.toUpperCase();
    } else {
      throw new Error(`Invalid URL encoded character: ${ch}`);
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
 * unescape URL encoded HTML special chars
 *
 * @param {string} ch - URL encoded char
 * @returns {string} - unescaped HTML special char
 */
export const unescapeUrlEncodedHtmlChars = ch => {
  let unescapedChar;
  if (/%26lt;?/.test(ch)) {
    unescapedChar = '<';
  } else if (/%26gt;?/.test(ch)) {
    unescapedChar = '>';
  } else if (/%26quot;?/.test(ch)) {
    unescapedChar = '"';
  } else if (/%26%2339;?/.test(ch)) {
    unescapedChar = "'";
  } else {
    unescapedChar = ch;
  }
  return unescapedChar;
};

/**
 * parse base64 encoded data
 *
 * @param {string} data - base64 encoded data
 * @returns {string} - parsed text data / base64 encoded data if binary
 */
export const parseBase64 = data => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  } else if (!REG_BASE64.test(data)) {
    throw new Error(`Invalid base64 data: ${data}`);
  }
  const bin = atob(data);
  const uint8arr = Uint8Array.from([...bin].map(c => c.charCodeAt(0)));
  const textCharCodes = new Set(textChars);
  let parsedData;
  if (uint8arr.every(c => textCharCodes.has(c))) {
    parsedData = bin.replace(/\s/g, getUrlEncodedString);
  } else {
    parsedData = data;
  }
  return parsedData;
};

/**
 * parse URL encoded numeric character references in the range 0x00 to 0xFF
 *
 * @param {string} str - string
 * @param {number} nest - nest level
 * @returns {string} - parsed string
 */
export const parseUrlEncodedNumCharRef = (str, nest = 0) => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  if (!Number.isInteger(nest)) {
    throw new TypeError(`Expected Number but got ${getType(nest)}.`);
  } else if (nest > HEX) {
    throw new Error('Character references nested too deeply.');
  }
  let res = decodeURIComponent(str);
  if (/&#/.test(res)) {
    const textCharCodes = new Set(textChars);
    const items = [...res.matchAll(REG_NUM_REF)].reverse();
    for (const item of items) {
      const [numCharRef, value] = item;
      let num;
      if (/^x[\dA-F]+/i.test(value)) {
        num = parseInt(`0${value}`, HEX);
      } else if (/^[\d]+/.test(value)) {
        num = parseInt(value);
      }
      if (Number.isInteger(num)) {
        const { index } = item;
        const [preNum, postNum] = [
          res.substring(0, index),
          res.substring(index + numCharRef.length)
        ];
        if (textCharCodes.has(num)) {
          res = `${preNum}${String.fromCharCode(num)}${postNum}`;
          if (/#x?$/.test(preNum) || /^#(?:x(?:00)?[2-7]|\d)/.test(postNum)) {
            res = parseUrlEncodedNumCharRef(res, ++nest);
          }
        } else if (num < HEX * HEX) {
          res = `${preNum}${postNum}`;
        }
      }
    }
  }
  return res;
};

/**
 * purify URL encoded DOM
 *
 * @param {string} dom - DOM input
 * @returns {string} - purified DOM
 */
export const purifyUrlEncodedDom = dom => {
  if (!isString(dom)) {
    throw new TypeError(`Expected String but got ${getType(dom)}.`);
  }
  return encodeURIComponent(domPurify.sanitize(decodeURIComponent(dom)));
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
};

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
   * @param {Array.<string>} opt.only - array of specific schemes to allow
   * @returns {?string} - sanitized URL
   */
  sanitize(url, opt = { allow: [], deny: [], only: [] }) {
    if (this.#nest > HEX) {
      this.#nest = 0;
      throw new Error('Data URLs nested too deeply.');
    }
    const { allow, deny, only } = opt ?? {};
    const schemeMap = new Map([
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
          if (!REG_SCRIPT.test(item)) {
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
            if (!REG_SCRIPT.test(item)) {
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
    if (super.isURI(url)) {
      const { hash, href, pathname, protocol, search } = new URL(url);
      const scheme = protocol.replace(/:$/, '');
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
        let escapeHtml;
        let urlToSanitize = href;
        if (schemeParts.includes('data')) {
          const [head, ...body] = pathname.split(',');
          const data = `${body.join(',')}${search}${hash}`;
          const mediaType = head.split(';');
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
          const containsDataUrl = /data:[^,]*,/.test(parsedData);
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
                if (parsedDataUrl) {
                  const { index } = item;
                  const [preDataUrl, postDataUrl] = [
                    parsedData.substring(0, index),
                    parsedData.substring(index + dataUrl.length)
                  ];
                  parsedData = `${preDataUrl}${parsedDataUrl}${postDataUrl}`;
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
          sanitizedUrl = urlToSanitize
            .replace(REG_HTML_SP, getUrlEncodedString)
            .replace(REG_URL_ENC_AMP, escapeUrlEncodedHtmlChars);
          if (escapeHtml) {
            sanitizedUrl = sanitizedUrl
              .replace(REG_HTML_SP_URL_ENC, escapeUrlEncodedHtmlChars);
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

  /**
   * object with extended props based on URL API
   *
   * @typedef {object} ParsedURL
   * @property {string} input - URL input
   * @property {boolean} valid - is valid URI
   * @property {object} data - parsed result of data URL, `null`able
   * @property {string} data.mime - MIME type
   * @property {boolean} data.base64 - `true` if base64 encoded
   * @property {string} data.data - data part of the data URL
   * @property {string} href - sanitized URL input
   * @property {string} origin - scheme, domain and port of the sanitized URL
   * @property {string} protocol -  protocol scheme of the sanitized URL
   * @property {string} username - username specified before the domain name
   * @property {string} password - password specified before the domain name
   * @property {string} host - domain and port of the sanitized URL
   * @property {string} hostname - domain of the sanitized URL
   * @property {string} port - port number of the sanitized URL
   * @property {string} pathname - path of the sanitized URL
   * @property {string} search - query string of the sanitized URL
   * @property {object} searchParams - URLSearchParams object
   * @property {string} hash - fragment identifier of the sanitized URL
   */

  /**
   * parse sanitized URL
   *
   * @param {string} url - URL input
   * @param {object} opt - options
   * @returns {ParsedURL} - result with extended props based on URL API
   */
  parse(url, opt) {
    if (!isString(url)) {
      throw new TypeError(`Expected String but got ${getType(url)}.`);
    }
    const sanitizedUrl = this.sanitize(url, opt ?? {
      allow: ['data', 'file']
    });
    const parsedUrl = new Map([
      ['input', url]
    ]);
    if (sanitizedUrl) {
      const urlObj = new URL(sanitizedUrl);
      const { pathname, protocol } = urlObj;
      const schemeParts = protocol.replace(/:$/, '').split('+');
      parsedUrl.set('valid', true);
      if (schemeParts.includes('data')) {
        const dataUrl = new Map();
        const [head, ...body] = pathname.split(',');
        const data = `${body.join(',')}`;
        const mediaType = head.split(';');
        const isBase64 = mediaType[mediaType.length - 1] === 'base64';
        if (isBase64) {
          mediaType.pop();
        }
        dataUrl.set('mime', mediaType.join(';'));
        dataUrl.set('base64', isBase64);
        let purifiedDom;
        if (!isBase64 && REG_MIME_DOM.test(head)) {
          let parsedData = data;
          const matchedHtmlChars = parsedData.matchAll(REG_URL_ENC_HTML_SP);
          const items = [...matchedHtmlChars].reverse();
          for (const item of items) {
            const [htmlChar] = item;
            const { index } = item;
            const [preHtmlChar, postHtmlChar] = [
              parsedData.substring(0, index),
              parsedData.substring(index + htmlChar.length)
            ];
            const unescapedHTMLChar = unescapeUrlEncodedHtmlChars(htmlChar);
            parsedData = `${preHtmlChar}${unescapedHTMLChar}${postHtmlChar}`;
          }
          purifiedDom = purifyUrlEncodedDom(parsedData);
          dataUrl.set('data', purifiedDom);
        } else {
          dataUrl.set('data', data);
        }
        parsedUrl.set('data', Object.fromEntries(dataUrl));
        for (const key in urlObj) {
          let value = urlObj[key];
          if (isString(value)) {
            if (isString(purifiedDom)) {
              switch (key) {
                case 'href':
                  value = `${protocol}${mediaType.join(';')},${purifiedDom}`;
                  break;
                case 'pathname':
                  value = `${mediaType.join(';')},${purifiedDom}`;
                  break;
                default:
              }
            }
            parsedUrl.set(key, value);
          }
        }
      } else {
        parsedUrl.set('data', null);
        for (const key in urlObj) {
          const value = urlObj[key];
          if (isString(value)) {
            parsedUrl.set(key, value);
          }
        }
      }
    } else {
      parsedUrl.set('valid', false);
    }
    return Object.fromEntries(parsedUrl);
  }
};

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
const sanitizeUrl = (url, opt) => {
  const parsedUrl = urlSanitizer.parse(url, opt ?? {
    allow: [],
    deny: [],
    only: []
  });
  let res;
  if (parsedUrl) {
    const { href } = parsedUrl;
    res = href;
  }
  return res ?? null;
};

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

/**
 * parse URL sync
 *
 * @param {string} url - URL input
 * @returns {ParsedURL} - result with extended props based on URL API
 */
const parseUrl = url => urlSanitizer.parse(url);

/**
 * parse URL async
 *
 * @param {string} url - URL input
 * @returns {Promise.<ParsedURL>} - result with extended props based on URL API
 */
export const parseURL = async url => {
  const res = await parseUrl(url);
  return res;
};

/* export instance and aliases */
export {
  urlSanitizer as default,
  isUri as isURISync,
  parseUrl as parseURLSync,
  sanitizeUrl as sanitizeURLSync
};
