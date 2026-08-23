/**
 * utility.js
 */

/* shared */
import { getType, isString } from './common.js';

/* constants */
import {
  BYTE_RANGE,
  CHUNK_SIZE,
  DECI,
  HEX,
  MAX_NEST,
  MAX_URL_LENGTH,
  TRUNCATE_LENGTH
} from './constant.js';
import {
  REG_AMP,
  REG_HASH,
  REG_NUM_REF,
  REG_PCT_ENC,
  REG_QUERY,
  REG_URL_ENC
} from './regexp.js';
import {
  NON_TEXT_CHAR_CODES,
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
  { length: BYTE_RANGE },
  (_, i) => `%${i.toString(HEX).padStart(2, '0').toUpperCase()}`
);
const IS_NODE = globalThis.process?.versions?.node !== undefined;
const NON_TEXT_PATTERN = `[${[...NON_TEXT_CHAR_CODES.values()].join('')}]`;
const REG_NON_TEXT = new RegExp(NON_TEXT_PATTERN);
const REG_NON_TEXT_G = new RegExp(NON_TEXT_PATTERN, 'g');
const SHARED_BUFFER = new Uint8Array(MAX_URL_LENGTH);

/* typedef */
/**
 * The extracted Data URL components.
 * @typedef {object} DataURLComponents
 * @property {string} data - The actual data part of the Data URL.
 * @property {boolean} isBase64 - Indicates whether the data is base64-encoded.
 * @property {string} mediaType - The MIME type of the data.
 * @property {string[]} mediaTypes - The array of parsed media types.
 */

/* encoder / decoder */
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

/**
 * Normalizes the URL string using NFKC.
 * @param {string} url - The URL string to normalize.
 * @param {boolean} [isScheme] - True if the given `url` is a scheme.
 * @returns {string|null} The normalized URL string, or null.
 */
export const normalizeURL = (url, isScheme = false) => {
  if (!isString(url)) {
    return null;
  }
  const normalized = url.normalize('NFKC');
  if (isScheme) {
    return normalized.trim().toLowerCase().replace(/:$/, '');
  }
  return normalized;
};

/**
 * Parses a URL string with a fallback.
 * @param {string} url - The URL string to parse.
 * @param {string} [base] - The base URL string.
 * @param {boolean} [normalize] - Indicates whether to normalize the URI.
 * @returns {URL|null} The parsed URL object, or null.
 */
export const parseURL = (url, base, normalize = false) => {
  if (!isString(url) || url === '') {
    return null;
  }
  let urlStr = url;
  let baseStr = base && isString(base) ? base : '';
  if (normalize) {
    urlStr = normalizeURL(urlStr);
    if (baseStr) {
      baseStr = normalizeURL(baseStr);
    }
  }
  if (typeof URL.parse === 'function') {
    return baseStr ? URL.parse(urlStr, baseStr) : URL.parse(urlStr);
  }
  try {
    return baseStr ? new URL(urlStr, baseStr) : new URL(urlStr);
  } catch {
    return null;
  }
};

/**
 * Extracts an array of schemes.
 * @param {string} protocol - The URL protocol (e.g., "data:", "git+https:").
 * @returns {string[]} An array of scheme parts.
 */
export const getSchemeParts = protocol => {
  if (!isString(protocol)) {
    return [];
  }
  return protocol.replace(/:$/, '').split('+');
};

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
  const encoded = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    encoded[i] = HEX_TABLE[bytes[i]];
  }
  return encoded.join('');
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
 * Truncates the URL string.
 * @param {string|unknown} url - A URL string.
 * @returns {string} The truncated string.
 */
export const truncateURL = url => {
  const str = isString(url) ? url : String(url);
  const truncated =
    str.length > TRUNCATE_LENGTH ? `${str.slice(0, TRUNCATE_LENGTH)}...` : str;
  return truncated;
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
 * Replaces URL-encoded numeric character references.
 * @param {string} match - The matched substring.
 * @param {string} value - The captured numeric value.
 * @returns {string} The resolved character or the original match.
 */
export const replaceNumCharRef = (match, value) => {
  const num = /^x/i.test(value)
    ? Number.parseInt(value.slice(1), HEX)
    : Number.parseInt(value, DECI);
  if (!Number.isInteger(num) || num < 0 || num >= BYTE_RANGE) {
    return match;
  }
  if (NON_TEXT_CHAR_CODES.has(num)) {
    return '';
  }
  if (TEXT_CHAR_CODES.has(num)) {
    return String.fromCharCode(num);
  }
  const codePoint = WINDOWS1252_TO_UNICODE.get(num);
  return String.fromCodePoint(codePoint);
};

/**
 * Parses URL-encoded numeric character references.
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
  res = res.replace(REG_NON_TEXT_G, '');
  let depth = 0;
  for (; depth + nest < MAX_NEST; depth++) {
    const previousRes = res;
    // Decode '&amp;' before decoding numeric references.
    res = res.replace(REG_AMP, '&').replace(REG_NUM_REF, replaceNumCharRef);
    if (res === previousRes) {
      break;
    }
  }
  if (depth + nest >= MAX_NEST && /&#/.test(res)) {
    throw new Error('Character references nested too deeply.');
  }
  return res;
};

/**
 * Extracts the components of a parsed Data URL.
 * @param {string} pathname - The pathname of the URL.
 * @param {string} [search] - The search (query) string of the URL.
 * @param {string} [hash] - The hash (fragment) of the URL.
 * @returns {DataURLComponents} The DataURLComponents object.
 */
export const extractDataURLComponents = (pathname, search = '', hash = '') => {
  if (!isString(pathname)) {
    return { mediaType: '', mediaTypes: [], data: '', isBase64: false };
  }
  const comma = pathname.indexOf(',');
  if (comma === -1) {
    return {
      mediaType: pathname,
      mediaTypes: pathname.split(';'),
      data: '',
      isBase64: false
    };
  }
  const mediaType = pathname.substring(0, comma);
  const dataPart = pathname.substring(comma + 1);
  const data =
    search === '' && hash === '' ? dataPart : dataPart + search + hash;
  const mediaTypes = mediaType.split(';');
  const lastType = mediaTypes.at(-1);
  const isBase64 =
    lastType !== undefined &&
    lastType.length === 6 &&
    lastType.toLowerCase() === 'base64';

  return { mediaType, mediaTypes, data, isBase64 };
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
  let binStr;
  let cleanData = data;
  try {
    binStr = atob(data);
  } catch {
    cleanData = data.replace(/\s/g, '');
    try {
      binStr = atob(cleanData);
    } catch {
      throw new Error(`Invalid base64 data: ${truncateURL(data)}`);
    }
  }
  let bytes;
  if (IS_NODE && globalThis.Buffer) {
    // Use 'latin1' to correctly map the binary string directly to bytes.
    // @see https://nodejs.org/docs/latest/api/buffer.html#buffers-and-character-encodings
    bytes = globalThis.Buffer.from(binStr, 'latin1');
  } else {
    const len = binStr.length;
    if (len <= MAX_URL_LENGTH) {
      bytes = SHARED_BUFFER.subarray(0, len);
    } else {
      bytes = new Uint8Array(len);
    }
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
  }
  try {
    const text = decoder.decode(bytes);
    if (REG_NON_TEXT.test(text)) {
      return cleanData;
    }
    return text;
  } catch {
    return cleanData;
  }
};

/**
 * Encodes an ArrayBuffer to a Base64 string.
 * @private
 * @param {ArrayBuffer} buffer - The buffer to encode.
 * @returns {string} The Base64 string.
 */
export const encodeBufferToBase64 = buffer => {
  if (IS_NODE && globalThis.Buffer) {
    return globalThis.Buffer.from(buffer).toString('base64');
  }
  const uint8arr = new Uint8Array(buffer);
  if (typeof uint8arr.toBase64 === 'function') {
    return uint8arr.toBase64();
  }
  const chunks = [];
  for (let i = 0; i < uint8arr.length; i += CHUNK_SIZE) {
    chunks.push(String.fromCharCode(...uint8arr.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(chunks.join(''));
};
