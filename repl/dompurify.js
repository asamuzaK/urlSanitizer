/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';

/**
 * Creates a new, isolated DOMPurify instance.
 * @returns {object} The isolated DOMPurify instance.
 */
export const createDOMPurify = () => {
  return DOMPurify(globalThis.window || globalThis);
};
