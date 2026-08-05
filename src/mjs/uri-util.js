/**
 * uri-util.js
 */

/* shared */
import uriSchemes from '../lib/iana/uri-schemes.json' with { type: 'json' };
import { getType, isString } from './common.js';

/* constants */
import {
  CHUNK_SIZE,
  DECI,
  HEX,
  MAX_BLOB_SIZE,
  MAX_NEST,
  TRUNCATE_LENGTH
} from './constant.js';
import {
  REG_AMP,
  REG_HASH,
  REG_NUM_REF,
  REG_PCT_ENC,
  REG_QUERY,
  REG_SCHEME_EXT,
  REG_SCRIPT,
  REG_URL_ENC
} from './regexp.js';
import {
  CTRL_CHAR_CODES,
  TEXT_CHAR_CODES,
  WINDOWS1252_TO_UNICODE
} from './text-chars.js';
const [ENC_AMP, ENC_NUM, ENC_LT, ENC_GT, ENC_QUOT, ENC_APOS] = [
  '&',
  '#',
  '<',
  '>',
  '"',
  "'"
].map(ch => `%${ch.charCodeAt(0).toString(HEX).toUpperCase()}`);
const ESCAPE_MAP = {
  [ENC_AMP]: `${ENC_AMP}amp;`,
  [ENC_LT]: `${ENC_AMP}lt;`,
  [ENC_GT]: `${ENC_AMP}gt;`,
  [ENC_QUOT]: `${ENC_AMP}quot;`,
  [ENC_APOS]: `${ENC_AMP}${ENC_NUM}39;`
};
const HEX_TABLE = Array.from(
  { length: HEX * HEX },
  (_, i) => `%${i.toString(HEX).padStart(2, '0').toUpperCase()}`
);
const IS_NODE = globalThis.process?.versions?.node !== undefined;
const CTRL_CHARS_PATTERN = `[${[...CTRL_CHAR_CODES.values()].join('')}]`;
const REG_CTRL_CHARS = new RegExp(CTRL_CHARS_PATTERN);
const REG_CTRL_CHARS_G = new RegExp(CTRL_CHARS_PATTERN, 'g');

/* encoder / decoder */
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

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
   * @param {string} scheme - The target scheme.
   * @returns {boolean} True if the scheme is registered.
   */
  has(scheme) {
    const normalizedScheme = this.normalize(scheme);
    if (normalizedScheme) {
      return this.#schemes.has(normalizedScheme);
    }
    return false;
  }

  /**
   * Normalizes the specified URI scheme.
   * @param {string} scheme - The URI scheme to normalize.
   * @returns {string|null} The normalized scheme string, or null.
   */
  normalize(scheme) {
    if (!isString(scheme)) {
      return null;
    }
    return scheme.trim().toLowerCase();
  }

  /**
   * Verifies if the pre-parsed URL object is valid and its scheme is allowed.
   * @param {URL} parsedUrl - The parsed URL object to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the parsed URL is syntactically valid and permitted.
   */
  verifyParsed(parsedUrl, schemes) {
    if (!parsedUrl || !parsedUrl.protocol) {
      return false;
    }
    const scheme = parsedUrl.protocol.replace(/:$/, '');
    const parts = scheme.split('+');
    const isScript = parts.some(s => REG_SCRIPT.test(s));
    if (isScript) {
      return false;
    }
    if (!schemes) {
      schemes = this.#schemes;
    }
    return REG_SCHEME_EXT.test(scheme) || parts.every(s => schemes.has(s));
  }

  /**
   * Verifies if the given URI is valid and its scheme is allowed.
   * @param {string} uri - The URI string to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the URI is syntactically valid and permitted.
   */
  verify(uri, schemes) {
    if (!isString(uri)) {
      return false;
    }
    const normalizedUri = uri.normalize('NFKC');
    const parsedUrl = URL.parse(normalizedUri);
    return this.verifyParsed(parsedUrl, schemes);
  }
}

/**
 * Gets the URL-encoded representation of a given string.
 * @param {string} str - The target string.
 * @returns {string} The URL-encoded string.
 */
export const getURLEncodedString = str => {
  if (!isString(str)) {
    throw new TypeError(`Expected String but got ${getType(str)}.`);
  }
  const bytes = encoder.encode(str);
  let encoded = '';
  for (let i = 0; i < bytes.length; i++) {
    encoded += HEX_TABLE[bytes[i]];
  }
  return encoded;
};

/**
 * Escapes URL-encoded HTML special characters.
 * @param {string} ch - A URL-encoded (percent-encoded) character.
 * @returns {string} The escaped HTML special character, or the given character.
 */
export const escapeURLEncodedHTMLChars = ch => {
  if (!isString(ch)) {
    return ch;
  }
  const target = REG_URL_ENC.test(ch) ? ch.toUpperCase() : ch;
  return ESCAPE_MAP[target] ?? ch;
};

/**
 * Truncate URL string.
 * @param {string|unknown} url - A URL string
 * @returns {string} - The truncated string
 */
export const truncateURL = url => {
  const str = isString(url) ? url : String(url);
  const truncated =
    str.length > TRUNCATE_LENGTH ? `${str.slice(0, TRUNCATE_LENGTH)}...` : str;
  return truncated;
};

/**
 * Parses base64-encoded data.
 * @param {string} data - The base64-encoded string.
 * @returns {string} The parsed text, or the original base64 if binary.
 */
export const parseBase64 = data => {
  if (!isString(data)) {
    throw new TypeError(`Expected String but got ${getType(data)}.`);
  }
  const cleanData = data.replace(/\s/g, '');
  let binStr;
  try {
    binStr = atob(cleanData);
  } catch {
    throw new Error(`Invalid base64 data: ${truncateURL(data)}`);
  }
  let bytes;
  if (IS_NODE && globalThis.Buffer) {
    // Use 'latin1' to correctly map the binary string directly to bytes.
    // @see https://nodejs.org/docs/latest/api/buffer.html#buffers-and-character-encodings
    bytes = globalThis.Buffer.from(binStr, 'latin1');
  } else {
    const len = binStr.length;
    bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
  }
  try {
    const text = decoder.decode(bytes);
    if (REG_CTRL_CHARS.test(text)) {
      return cleanData;
    }
    return text;
  } catch {
    return cleanData;
  }
};

/**
 * Replaces URL-encoded numeric character references.
 * @param {string} match - The matched substring.
 * @param {string} value - The captured numeric value.
 * @returns {string} The resolved character or the original match.
 */
export const replaceNumCharRef = (match, value) => {
  const num = /x/i.test(value[0])
    ? parseInt(value.substring(1), HEX)
    : parseInt(value, DECI);
  if (Number.isInteger(num)) {
    if (TEXT_CHAR_CODES.has(num)) {
      return String.fromCharCode(num);
    } else if (WINDOWS1252_TO_UNICODE.has(num)) {
      const codePoint = WINDOWS1252_TO_UNICODE.get(num);
      return String.fromCodePoint(codePoint);
    } else if (CTRL_CHAR_CODES.has(num)) {
      return '';
    }
  }
  return match;
};

/**
 * Removes a trailing empty hash and an empty query string from a URL.
 * @param {string} url - The target URL string to be cleaned.
 * @returns {string} The cleaned URL string or the original input.
 */
export const trimTrailingEmptyQueryAndHash = url => {
  if (!isString(url)) {
    return url;
  }
  return url.replace(REG_HASH, '').replace(REG_QUERY, '$1');
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
  }
  let res;
  try {
    res = decodeURIComponent(str);
  } catch {
    // Fallback: decode only valid multi-byte %XX sequences.
    res = str.replace(REG_PCT_ENC, match => {
      try {
        return decodeURIComponent(match);
      } catch {
        return match;
      }
    });
  }
  res = res.replace(REG_CTRL_CHARS_G, '');
  let depth = 0;
  for (; depth + nest <= MAX_NEST; depth++) {
    const previousRes = res;
    // Decode '&amp;' before decoding numeric references.
    res = res.replace(REG_AMP, '&').replace(REG_NUM_REF, replaceNumCharRef);
    if (res === previousRes) {
      break;
    }
  }
  if (depth + nest > MAX_NEST && /&#/.test(res)) {
    throw new Error('Character references nested too deeply.');
  }
  return res;
};

/**
 * Converts Blob to data URL from Buffer.
 * @private
 * @param {Blob} blob - The target Blob object.
 * @returns {Promise<string|null>} A promise resolving to the data URL, or null.
 */
const convertFromBuffer = async blob => {
  const mimeStr = blob.type ? `${blob.type};base64` : 'base64';
  const buffer = await blob.arrayBuffer();
  const base64 = globalThis.Buffer.from(buffer).toString('base64');
  return `data:${mimeStr},${base64}`;
};

/**
 * Converts Blob to data URL from FileReader.
 * @private
 * @param {Blob} blob - The target Blob object.
 * @returns {Promise<string|null>} A promise resolving to the data URL, or null.
 */
const convertFromFileReader = blob =>
  new Promise((resolve, reject) => {
    const reader = new globalThis.FileReader();
    reader.addEventListener('error', () => {
      const error =
        reader.error ||
        new DOMException(
          'Failed to read Blob via FileReader.',
          'NotReadableError'
        );
      reject(error);
    });
    reader.addEventListener('abort', () => resolve(null));
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(blob);
  });

/**
 * Converts Blob to data URL from btoa.
 * @private
 * @param {Blob} blob - The target Blob object.
 * @returns {Promise<string|null>} A promise resolving to the data URL, or null.
 */
const convertFromBtoa = async blob => {
  const mimeStr = blob.type ? `${blob.type};base64` : 'base64';
  const buffer = await blob.arrayBuffer();
  const uint8arr = new Uint8Array(buffer);
  const chunks = [];
  for (let i = 0; i < uint8arr.length; i += CHUNK_SIZE) {
    chunks.push(String.fromCharCode(...uint8arr.subarray(i, i + CHUNK_SIZE)));
  }
  return `data:${mimeStr},${btoa(chunks.join(''))}`;
};

/**
 * Fetches a blob URL and converts it to a data URL.
 * @param {string} url - The blob URL to fetch.
 * @param {number} [maxBlobSize] - The maximum allowed blob size in bytes.
 * @returns {Promise<string>} A promise resolving to the data URL.
 */
export const fetchBlobAsDataURL = async (url, maxBlobSize) => {
  const response = await fetch(url);
  const blob = await response.blob();
  let maxSize = MAX_BLOB_SIZE;
  if (Number.isInteger(maxBlobSize) && maxBlobSize > 0) {
    maxSize = maxBlobSize;
  }
  if (blob.size > maxSize) {
    const msg = `Blob size (${blob.size} bytes) exceeds max (${maxSize} bytes).`;
    throw new DOMException(msg, 'NotReadableError');
  }
  if (IS_NODE && globalThis.Buffer) {
    return convertFromBuffer(blob);
  } else if (globalThis.FileReader) {
    return convertFromFileReader(blob);
  }
  return convertFromBtoa(blob);
};

/**
 * Extracts an array of schemes by removing the trailing colon from the protocol string and splitting it by '+'.
 * @param {string} protocol - The URL protocol (e.g., "data:", "blob:http:").
 * @returns {string[]} An array of scheme parts.
 */
export const getSchemeParts = protocol => {
  if (!isString(protocol)) {
    return [];
  }
  return protocol.replace(/:$/, '').split('+');
};

/**
 * Parses a URL string and extracts the scheme.
 * @param {string} url - The URL string to parse.
 * @returns {string|undefined} The extracted scheme, or undefined if parsing fails.
 */
export const getURLScheme = url => {
  if (!isString(url)) {
    return undefined;
  }
  const parsedUrl = URL.parse(url);
  return parsedUrl ? parsedUrl.protocol.replace(/:$/, '') : undefined;
};

/**
 * Extracts the components of a parsed Data URL.
 * @param {string} pathname - The pathname of the URL.
 * @param {string} [search] - The search (query) string of the URL.
 * @param {string} [hash] - The hash (fragment) of the URL.
 * @returns {object} An object containing the media type, parsed media types array, data string, and a boolean indicating if it is base64-encoded.
 */
export const extractDataUrlComponents = (pathname, search = '', hash = '') => {
  if (!isString(pathname)) {
    return { mediaType: '', mediaTypes: [], data: '', isBase64: false };
  }
  const [mediaType, ...dataParts] = pathname.split(',');
  const data = `${dataParts.join(',')}${search}${hash}`;
  const mediaTypes = mediaType.split(';');
  const isBase64 = mediaTypes[mediaTypes.length - 1] === 'base64';
  return { mediaType, mediaTypes, data, isBase64 };
};
