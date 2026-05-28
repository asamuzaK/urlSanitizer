/**
 * dompurify.js (for wo-dompurify build)
 */

/* constants */
const PROPERTIES = Object.freeze([
  'addHook',
  'removeHook',
  'removeAllHooks',
  'setConfig'
]);

const hookQueue = [];
export const domPurify = new Proxy({}, {
  get(target, prop) {
    const purifier = globalThis.DOMPurify || globalThis.window?.DOMPurify;
    if (purifier) {
      if (hookQueue.length) {
        for (const { prop: p, args } of hookQueue) {
          if (typeof purifier[p] === 'function') {
            purifier[p](...args);
          }
        }
        hookQueue.length = 0;
      }
      const value = purifier[prop];
      return typeof value === 'function' ? value.bind(purifier) : value;
    }
    return (...args) => {
      if (PROPERTIES.includes(prop)) {
        hookQueue.push({ prop, args });
        return;
      }
      throw new Error('DOMPurify is not available. Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).');
    };
  }
});
