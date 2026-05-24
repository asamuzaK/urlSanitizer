/**
 * uri-util.js
 */

/* shared */
import textChars from '../lib/file/text-chars.json' with { type: 'json' };
import uriSchemes from '../lib/iana/uri-schemes.json' with { type: 'json' };
import { getType, isString } from './common.js';
import { FileReader } from './file-reader.js';

/* constants */
import {
  HEX, MAX_BLOB_SIZE, REG_B64, REG_NUM_REF, REG_SCHEME_EXT, REG_SCRIPT,
  REG_URL_ENC
} from './constant.js';

/**
 * URI schemes
 */
export class URISchemes {
  /* private fields */
  #schemes = new Set(uriSchemes);

  /**
   * Gets the list of registered URI schemes.
   * @see {@link https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml}
   * - Historical schemes are omitted.
   * - The 'moz-extension' scheme is added by default.
   * @returns {string[]} An array of registered schemes.
   */
  get() {
    return [...this.#schemes];
  }

  /**
   * Checks if the specified scheme is currently registered.
   * @param {string} scheme - The target scheme (e.g., 'https').
   * @returns {boolean} True if the scheme is registered.
   */
  has(scheme) {
    return this.#schemes.has(scheme);
  }

  /**
   * Verifies if the given URI is valid and its scheme is allowed.
   * @param {string} uri - The URI string to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the URI is syntactically valid and permitted.
   */
  verify(uri, schemes = this.#schemes) {
    let res;
    if (isString(uri)) {
      try {
        const { protocol } = new URL(uri);
        const scheme = protocol.replace(/:$/, '');
        const schemeParts = scheme.split('+');
        const isScript = schemeParts.some(s => REG_SCRIPT.test(s));
        res = !isScript && (
          REG_SCHEME_EXT.test(scheme) ||
          schemeParts.every(s => schemes.has(s))
        );
      } catch (e) {
        res = false;
      }
    }
    return !!res;
  }
}

/**
 * Gets the URL-encoded representation of a given string.
 * @param {string} str - The target string.
 * @returns {string} The completely URL-encoded string.
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
 * Escapes URL-encoded HTML special characters.
 * @param {string} ch - A URL-encoded (percent-encoded) character.
 * @returns {string} The escaped HTML special character, or the given character.
 */
export const escapeURLEncodedHTMLChars = ch => {
  if (isString(ch) && REG_URL_ENC.test(ch)) {
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
 * Parses base64-encoded data.
 * @param {string} data - The base64-encoded string.
 * @returns {string} The parsed text, or the original base64 if binary.
 */
export const parseBase64 = data => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  } else if (!REG_B64.test(data)) {
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
 * Parses URL-encoded numeric character references in the range 0x00 to 0xFF.
 * @param {string} str - The target string to parse.
 * @param {number} [nest] - The current nesting depth for recursive parsing.
 * @returns {string} The decoded and parsed string.
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
    const items = [...res.matchAll(REG_NUM_REF)].reverse();
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
          if (/#x?$/.test(preNum) || /^#(?:x(?:00)?[2-7]|\d)/.test(postNum)) {
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
 * Creates a base64 data URL asynchronously from a given Blob.
 * @param {Blob} blob - The target Blob object.
 * @param {number} [maxBlobSize] - The maximum allowed blob size in bytes.
 * @returns {Promise<string|null>} A promise resolving to the data URL, or null.
 */
export const createDataURLFromBlob = (blob, maxBlobSize = MAX_BLOB_SIZE) =>
  new Promise((resolve, reject) => {
    if (!Number.isInteger(blob?.size)) {
      return resolve(null);
    } else if (Number.isInteger(maxBlobSize) && blob.size > maxBlobSize) {
      return reject(new DOMException(
        `Blob size (${blob.size} bytes) exceeds the maximum allowed size of ${maxBlobSize} bytes.`,
        'NotReadableError'
      ));
    }
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(reader.error));
    reader.addEventListener('abort', () => resolve(reader.result));
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(blob);
  });
