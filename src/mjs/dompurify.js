/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');

/**
 * Creates a new, isolated DOMPurify instance.
 * @returns {object} The isolated DOMPurify instance.
 */
export const createDOMPurify = () => {
  return DOMPurify(window);
};
