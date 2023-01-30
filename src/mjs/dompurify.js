/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const domPurify = DOMPurify(window);

export {
  domPurify as default
};
