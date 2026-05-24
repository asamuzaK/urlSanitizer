/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Creates a new, isolated DOMPurify instance.
 * @returns {object} The isolated DOMPurify instance.
 */
export const createDOMPurify = () => {
  const { window } = new JSDOM('');
  return DOMPurify(window);
};
