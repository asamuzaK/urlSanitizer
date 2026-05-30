/**
 * constant.js
 */

/**
 * The chunk size in bytes (8KB) used for processing data arrays to prevent stack overflow.
 * @type {number}
 */
export const CHUNK_SIZE = 8 * 1024;

/**
 * The radix used for decimal string conversions and calculations.
 * @type {number}
 */
export const DECI = 10;

/**
 * The radix used for hexadecimal string conversions and calculations.
 * @type {number}
 */
export const HEX = 16;

/**
 * The maximum allowed size for a Blob in bytes (16MB).
 * @type {number}
 */
export const MAX_BLOB_SIZE = 16 * 1024 * 1024;

/**
 * The maximum allowed nesting depth for recurse.
 * @type {number}
 */
export const MAX_NEST = 16;

/**
 * The start index for extracting the core type name from an object.
 * (e.g., skips "[object " in "[object String]")
 * @type {number}
 */
export const TYPE_FROM = 8;

/**
 * The end index for extracting the core type name from an object.
 * (e.g., excludes the trailing "]" in "[object String]")
 * @type {number}
 */
export const TYPE_TO = -1;
