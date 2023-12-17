/**
 * uri-util.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' assert { type: 'json' };
import uriSchemes from '../lib/iana/uri-schemes.json' assert { type: 'json' };
import { getType, isString } from './common.js';
import { FileReader } from './file-reader.js';
import { HEX, REG_END_COLON, REG_SCRIPT } from './constant.js';

/**
 * get URL encoded string
 * @param {string} str - string
 * @returns {string} - URL encoded string
 */
export const getURLEncodedString = str => {
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
 * @param {string} ch - URL encoded (percent encoded) char
 * @returns {string} - escaped URL encoded HTML special char / URL encoded char
 */
export const escapeURLEncodedHTMLChars = ch => {
  if (isString(ch) && /^%[\dA-F]{2}$/i.test(ch)) {
    ch = ch.toUpperCase();
  }
  const [amp, num, lt, gt, quot, apos] =
    ['&', '#', '<', '>', '"', "'"].map(getURLEncodedString);
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
 * parse base64 encoded data
 * @param {string} data - base64 encoded data
 * @returns {string} - parsed text data / base64 encoded data if binary
 */
export const parseBase64 = data => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  } else if (!/^[\w+/\-=]+$/.test(data)) {
    throw new Error(`Invalid base64 data: ${data}`);
  }
  const bin = atob(data);
  const uint8arr = Uint8Array.from([...bin].map(c => c.charCodeAt(0)));
  const textCharCodes = new Set(textChars);
  let parsedData;
  if (uint8arr.every(c => textCharCodes.has(c))) {
    parsedData = bin.replace(/\s/g, getURLEncodedString);
  } else {
    parsedData = data;
  }
  return parsedData;
};

/**
 * parse URL encoded numeric character references in the range 0x00 to 0xFF
 * @param {string} str - string
 * @param {number} [nest] - nest level
 * @returns {string} - parsed string
 */
export const parseURLEncodedNumCharRef = (str, nest = 0) => {
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
    const items =
      [...res.matchAll(/&#(x(?:00)?[\dA-F]{2}|0?\d{1,3});?/gi)].reverse();
    for (const item of items) {
      const [numCharRef, value] = item;
      let num;
      if (/^x[\dA-F]+/i.test(value)) {
        num = parseInt(`0${value}`, HEX);
      } else if (/^\d+/.test(value)) {
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
          if (/#x?$/.test(preNum) ||
              /^#(?:x(?:00)?[2-7]|\d)/.test(postNum)) {
            res = parseURLEncodedNumCharRef(res, ++nest);
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
 * create data URL from blob
 * @param {object} blob - blob
 * @returns {Promise.<?string>} - data URL
 */
export const createDataURLFromBlob = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener('error', () => reject(reader.error));
  reader.addEventListener('abort', () => resolve(reader.result));
  reader.addEventListener('load', () => resolve(reader.result));
  reader.readAsDataURL(blob);
});

/**
 * URI schemes
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
   * @param {string} scheme - scheme
   * @returns {boolean} - result
   */
  has(scheme) {
    return this.#schemes.has(scheme);
  }

  /**
   * add scheme
   * NOTE: `javascript` and/or `vbscript` schemes can not be registered
   * @param {string} scheme - scheme
   * @returns {Array.<string>} - array of schemes
   */
  add(scheme) {
    if (!isString(scheme)) {
      throw new TypeError(`Expected String but got ${getType(scheme)}.`);
    } else if (REG_SCRIPT.test(scheme) || !/^[a-z][\da-z+\-.]*$/.test(scheme)) {
      throw new Error(`Invalid scheme: ${scheme}`);
    }
    this.#schemes.add(scheme);
    return [...this.#schemes];
  }

  /**
   * remove scheme
   * @param {string} scheme - scheme
   * @returns {boolean} - result
   */
  remove(scheme) {
    return this.#schemes.delete(scheme);
  }

  /**
   * verify URI
   * @param {string} uri - URI
   * @returns {boolean} - result
   */
  verify(uri) {
    let res;
    if (isString(uri)) {
      try {
        const { protocol } = new URL(uri);
        const scheme = protocol.replace(REG_END_COLON, '');
        const schemeParts = scheme.split('+');
        res = (!REG_SCRIPT.test(scheme) &&
               /^(?:ext|web)\+[a-z]+$/.test(scheme)) ||
              schemeParts.every(s => this.#schemes.has(s));
      } catch (e) {
        res = false;
      }
    }
    return !!res;
  }

  /**
   * reset schemes
   * @returns {void}
   */
  reset() {
    this.#schemes.clear();
    for (const scheme of uriSchemes) {
      this.#schemes.add(scheme);
    }
  }
};
