/**
 * dompurify.js
 */

import { createDOMPurify } from 'purify-edge';

/**
 * An instance of DOMPurify initialized with a window shim.
 * @type {import('purify-edge').DOMPurify}
 */
export const domPurify = createDOMPurify();
