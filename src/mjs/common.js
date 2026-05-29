/**
 * common.js
 */

/* shared */
import { TYPE_FROM, TYPE_TO } from './constant.js';

/**
 * Gets the exact type of the given object.
 * @param {unknown} o - The object to check.
 * @returns {string} The specific type of the object.
 */
export const getType = o =>
  Object.prototype.toString.call(o).slice(TYPE_FROM, TYPE_TO);

/**
 * Checks if the given value is a string.
 * @param {unknown} o - The value to check.
 * @returns {boolean} True if the value is a string, false otherwise.
 */
export const isString = o => typeof o === 'string' || o instanceof String;
