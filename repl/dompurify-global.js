/**
 * dompurify.js
 */

const domPurify = globalThis.DOMPurify || globalThis.window?.DOMPurify;

if (!domPurify) {
  const msg = [
    'DOMPurify is not defined.'
    'Please ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
  ]
  throw new Error(msg.join(' '));
}

export { domPurify };
