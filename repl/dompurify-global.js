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
let cachedPurifier = null;

export const domPurify = new Proxy({}, {
  get(target, prop, receiver) {
    const globalObject = globalThis.window ?? globalThis;
    const domPurifyFactory = globalObject.DOMPurify;
    if (domPurifyFactory) {
      if (!cachedPurifier) {
        cachedPurifier = typeof domPurifyFactory === 'function'
          ? domPurifyFactory(globalObject)
          : domPurifyFactory;
      }
      if (cachedPurifier) {
        if (hookQueue.length) {
          for (const { prop: p, args } of hookQueue) {
            if (typeof cachedPurifier[p] === 'function') {
              cachedPurifier[p](...args);
            }
          }
          hookQueue.length = 0;
        }
        const value = cachedPurifier[prop];
        return typeof value === 'function' ? value.bind(cachedPurifier) : value;
      }
    }
    return (...args) => {
      if (PROPERTIES.includes(prop)) {
        hookQueue.push({ prop, args });
        return receiver;
      }
      throw new Error('DOMPurify is not available. Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).');
    };
  }
});
