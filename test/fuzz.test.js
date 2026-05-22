/**
 * fuzz.test.js
 */

/* api */
import fc from 'fast-check';
import { describe, it } from 'mocha';

/* test target */
import { sanitizeURLSync } from '../src/mjs/sanitizer.js';

describe('Fuzz Testing (Property-based Testing)', () => {
  describe('sanitizeURLSync', () => {
    it('should never crash with completely random strings', () => {
      fc.assert(
        fc.property(fc.string(), (randomString) => {
          try {
            sanitizeURLSync(randomString, { debug: false });
            return true;
          } catch (e) {
            if (e.message === 'Data URLs nested too deeply.') {
              return true;
            }
            console.error('Unhandled crash:', e);
            return false;
          }
        }),
        { numRuns: 1000 }
      );
    });

    it('should never crash with randomly generated valid web URLs', () => {
      fc.assert(
        fc.property(fc.webUrl(), (randomUrl) => {
          try {
            sanitizeURLSync(randomUrl);
            return true;
          } catch (e) {
            console.error('Unhandled crash with URL:', randomUrl, e);
            return false;
          }
        }),
        { numRuns: 1000 }
      );
    });

    it('should never crash with randomly constructed data URLs', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 1000 }),
          fc.string({ maxLength: 5000 }),
          (randomMime, randomData) => {
            const dataUrl = `data:${randomMime},${randomData}`;
            try {
              sanitizeURLSync(dataUrl, { allow: ['data'] });
              return true;
            } catch (e) {
              if (e.message === 'Data URLs nested too deeply.') {
                return true;
              }
              console.error('Unhandled crash with Data URL:', dataUrl, e);
              return false;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should never crash and always return null for javascript: URLs', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 5000 }),
          (randomScript) => {
            const url = `javascript:${randomScript}`;
            try {
              const res = sanitizeURLSync(url);
              if (res !== null) {
                console.error('Bypass detected! URL:', url, 'Result:', res);
                return false;
              }
              return true;
            } catch (e) {
              console.error('Unhandled crash with javascript URL:', url, e);
              return false;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should never crash and always return null for vbscript: URLs', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 5000 }),
          (randomScript) => {
            const url = `vbscript:${randomScript}`;
            try {
              const res = sanitizeURLSync(url);
              if (res !== null) {
                console.error('Bypass detected! URL:', url, 'Result:', res);
                return false;
              }
              return true;
            } catch (e) {
              console.error('Unhandled crash with vbscript URL:', url, e);
              return false;
            }
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
