/**
 * dompurify.js
 */

/**
 * Creates a new, isolated DOMPurify instance.
 * @returns {object} The isolated DOMPurify instance.
 */
export const createDOMPurify = () => {
  if (globalThis?.DOMPurify) {
    return globalThis.DOMPurify(globalThis.window || globalThis);
  }
  const msg = [
    'DOMPurify is not available.',
    'Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
  ];
  throw new Error(msg.join(' '));
};
