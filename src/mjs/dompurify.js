/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');

/**
 * An instance of DOMPurify initialized with a JSDOM window context.
 * Used to sanitize HTML/SVG strings.
 * @type {import('dompurify')}
 */
export const domPurify = DOMPurify(window);
