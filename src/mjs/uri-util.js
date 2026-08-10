/**
 * uri-util.js
 */

/* shared */
import uriSchemes from '../lib/iana/uri-schemes.json' with { type: 'json' };
import { getType, isString } from './common.js';

/* constants */
import {
  BYTE_RANGE,
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
   * Extracts the scheme from URI.
   * @param {string} uri - The URI string.
   * @returns {string|null} The extracted scheme, or null.
   */
  getScheme(uri) {
    if (!isString(uri)) {
      return null;
    }
    const parsed = this.parse(uri);
    if (parsed) {
      return parsed.protocol.replace(/:$/, '');
    }
    return null;
  }

  /**
   * Checks if the specified scheme is currently registered.
   * @param {string} scheme - The target scheme.
   * @returns {boolean} True if the scheme is registered.
   */
  has(scheme) {
    const normalized = this.normalize(scheme, true);
    if (normalized) {
      return this.#schemes.has(normalized);
    }
    return false;
  }

  /**
   * Normalizes the URI string using NFKC.
   * @param {string} uri - The URL to normalize.
   * @param {boolean} [isScheme=false] - True if uri is a scheme.
   * @returns {string|null} The normalized URI string, or null.
   */
  normalize(uri, isScheme = false) {
    if (!isString(uri)) {
      return null;
    }
    const normalized = uri.normalize('NFKC');
    if (isScheme) {
      return normalized.trim().toLowerCase();
    }
    return normalized;
  }

  /**
   * Parse the URI string.
   * @param {string} uri - The URI string.
   * @param {string} [base] - The base URI string.
   * @returns {URL|null} The parsed URL object, or null.
   */
  parse(uri, base) {
    if (!isString(uri)) {
      return null;
    }
    const normalized = this.normalize(uri);
    if (base && isString(base)) {
      return URL.parse(normalized, this.normalize(base));
    }
    return URL.parse(normalized);
  }

  /**
   * Verifies if the given URI is valid and its scheme is allowed.
   * @param {string} uri - The URI string to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the URI is valid and permitted.
   */
  verify(uri, schemes) {
    if (!isString(uri)) {
      return false;
    }
    const parsedUrl = this.parse(uri);
    return this.verifyParsed(parsedUrl, schemes);
  }

  /**
   * Verifies if the pre-parsed URL object is valid and its scheme is allowed.
   * @param {URL} parsedUrl - The parsed URL object to verify.
   * @param {Set<string>} [schemes] - The set of allowed schemes.
   * @returns {boolean} True if the parsed URL is valid and permitted.
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
}

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
  const comma = pathname.indexOf(',');
  if (comma === -1) {
    return {
      mediaType: pathname,
      mediaTypes: pathname.split(';'),
      data: '',
      isBase64: false
    };
  }
  const mediaType = pathname.slice(0, comma);
  const data = `${pathname.slice(comma + 1)}${search}${hash}`;
  const mediaTypes = mediaType.split(';');
  const isBase64 = /^base64$/i.test(mediaTypes.at(-1));
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
    if (REG_NON_TEXT.test(text)) {
      return cleanData;
    }
    return text;
  } catch {
    return cleanData;
  }
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
 * Reads a stream in chunks and validates its size.
 * @private
 * @param {ReadableStreamDefaultReader} reader - The stream reader.
 * @param {number} maxSize - The maximum allowed size in bytes.
 * @param {Uint8Array[]} chunks - The array to store chunks.
 * @param {number} [accumulatedSize] - The currently accumulated size.
 * @returns {Promise<void>}
 */
const readStreamInChunks = async (
  reader,
  maxSize,
  chunks,
  accumulatedSize = 0
) => {
  const { done, value } = await reader.read();
  if (done) {
    return;
  }
  const newSize = accumulatedSize + value.byteLength;
  if (newSize > maxSize) {
    await reader.cancel('Size limit exceeded');
    const msg = `Blob size (${newSize} bytes) exceeds max (${maxSize} bytes).`;
    throw new DOMException(msg, 'NotReadableError');
  }
  chunks.push(value);
  return readStreamInChunks(reader, maxSize, chunks, newSize);
};

/**
 * Fetches a blob URL and converts it to a data URL.
 * @param {string} url - The blob URL to fetch.
 * @param {number} [maxBlobSize] - The maximum allowed blob size in bytes.
 * @returns {Promise<string>} A promise resolving to the data URL.
 */
export const fetchBlobAsDataURL = async (url, maxBlobSize) => {
  let maxSize = MAX_BLOB_SIZE;
  if (Number.isInteger(maxBlobSize) && maxBlobSize > 0) {
    maxSize = maxBlobSize;
  }
  const response = await fetch(url);
  if (!response.ok) {
    const truncatedUrl = truncateURL(url);
    let msg = `Failed to fetch ${truncatedUrl}`;
    if (Number.isInteger(response.status)) {
      if (response.statusText) {
        msg += `: ${response.status} ${response.statusText}`;
      } else {
        msg += `: ${response.status}`;
      }
    }
    throw new Error(msg);
  }
  // Check content length if available.
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, DECI);
    if (Number.isInteger(parsedLength) && parsedLength > maxSize) {
      const msg = `Blob size (${parsedLength} bytes) exceeds max (${maxSize} bytes).`;
      throw new DOMException(msg, 'NotReadableError');
    }
  }
  let blob;
  // Use ReadableStream.
  if (response.body) {
    const reader = response.body.getReader();
    const chunks = [];
    try {
      await readStreamInChunks(reader, maxSize, chunks, 0);
    } finally {
      reader.releaseLock();
    }
    const type = response.headers.get('content-type');
    if (type) {
      blob = new Blob(chunks, { type });
    } else {
      blob = new Blob(chunks);
    }
  } else {
    blob = await response.blob();
    if (blob.size > maxSize) {
      const msg = `Blob size (${blob.size} bytes) exceeds max (${maxSize} bytes).`;
      throw new DOMException(msg, 'NotReadableError');
    }
  }
  if (IS_NODE && globalThis.Buffer) {
    return convertFromBuffer(blob);
  } else if (globalThis.FileReader) {
    return convertFromFileReader(blob);
  }
  return convertFromBtoa(blob);
};
