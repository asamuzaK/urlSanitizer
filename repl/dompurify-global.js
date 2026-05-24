/**
 * dompurify.js
 */

let isolatedDOMPurify = null;

const getIsolatedInstance = () => {
  if (isolatedDOMPurify) {
    return isolatedDOMPurify;
  }
  if (globalThis?.DOMPurify) {
    isolatedDOMPurify = globalThis.DOMPurify(globalThis.window || globalThis);
    return isolatedDOMPurify;
  }
  const msg = [
    'DOMPurify is not available.',
    'Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
  ];
  throw new Error(msg.join(' '));
};

const domPurify = {
  addHook: (...args) => {
    return getIsolatedInstance().addHook(...args);
  },
  removeHook: (...args) => {
    return getIsolatedInstance().removeHook(...args);
  },
  sanitize: (...args) => {
    return getIsolatedInstance().sanitize(...args);
  }
};

export {
  domPurify
};
