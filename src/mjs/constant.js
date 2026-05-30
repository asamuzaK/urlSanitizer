/**
 * constant.js
 */

/**
 * Chunk size (8KB) used when processing byte arrays to avoid stack overflow.
 * @type {number}
 */
export const CHUNK_SIZE = 8 * 1024;

/**
 * Decimal radix used for numeric string conversion.
 * @type {number}
 */
export const DECI = 10;

/**
 * Hexadecimal radix used for numeric string conversion.
 * @type {number}
 */
export const HEX = 16;

/**
 * Maximum allowed Blob size (16MB).
 * @type {number}
 */
export const MAX_BLOB_SIZE = 16 * 1024 * 1024;

/**
 * Maximum recursion depth allowed for nested parsing.
 * @type {number}
 */
export const MAX_NEST = 16;

/**
 * Start index used to extract the type name from Object.prototype.toString().
 * (e.g. removes "[object " prefix)
 * @type {number}
 */
export const TYPE_FROM = 8;

/**
 * End index used to extract the type name from Object.prototype.toString().
 * (e.g. removes trailing "]")
 * @type {number}
 */
export const TYPE_TO = -1;
