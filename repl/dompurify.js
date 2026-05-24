/**
 * dompurify.js
 */

import DOMPurify from 'dompurify';

const domPurify = DOMPurify(globalThis.window || globalThis);

export {
  domPurify
};
