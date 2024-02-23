/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
export const domPurify = DOMPurify(window);
