/**
 * dompurify.js
 */

const domPurify = {
  sanitize: (...args) => {
    if (globalThis?.DOMPurify) {
      return globalThis.DOMPurify.sanitize(...args);
    }

    const msg = [
      'DOMPurify is not available.',
      'Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
    ];
    throw new Error(msg.join(' '));
  }
};

export {
  domPurify
};
