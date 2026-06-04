/**
 * fuzz.test.js
 */
/* eslint-disable no-control-regex */

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

    it('should correctly handle control characters', () => {
      const ctrlCharArb = fc.tuple(
        fc.constantFrom(
          0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21,
          22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127
        ),
        fc.constantFrom('dec', 'hex', 'raw')
      ).map(([code, type]) => {
        if (type === 'dec') {
          return `&#${code};`;
        }
        if (type === 'hex') {
          return `&#x${code.toString(16).toUpperCase()};`;
        }
        return String.fromCharCode(code);
      });

      fc.assert(
        fc.property(
          fc.constantFrom('javascript', 'vbscript'),
          fc.array(ctrlCharArb, { minLength: 1, maxLength: 3 }),
          fc.string({ maxLength: 100 }),
          (scheme, ctrls, suffix) => {
            const mid = Math.floor(scheme.length / 2);
            const obfuscatedScheme =
              scheme.slice(0, mid) + ctrls.join('') + scheme.slice(mid);
            const dataUrl = `data:text/html,${obfuscatedScheme}:alert(1)`;
            try {
              const res = sanitizeURLSync(dataUrl, { allow: ['data'] });
              if (res !== null) {
                console.error(
                  'Bypass detected via control character in data URL:',
                  dataUrl, 'Result:', res
                );
                return false;
              }
            } catch (e) {
              if (e.message !== 'Character references nested too deeply.') {
                console.error('Unhandled crash in data URL with control char:',
                  dataUrl, e);
                return false;
              }
            }
            const directUrl = `${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res &&
                  (res.startsWith('javascript:') ||
                   res.startsWith('vbscript:'))
              ) {
                console.error('Bypass detected via direct obfuscated URL:',
                  directUrl, 'Result:', res);
                return false;
              }
            } catch (e) {
              console.error('Unhandled crash in direct URL with control char:',
                directUrl, e);
              return false;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should correctly handle Unicode control and invisible chars', () => {
      const unicodeCtrlArb = fc.tuple(
        fc.constantFrom(
          // C1 Control characters (U+0080 - U+009F)
          ...Array.from({ length: 32 }, (_, i) => 0x80 + i),
          // Zero-width & Invisible formats
          0x200B, 0x200C, 0x200D, 0xFEFF,
          // Bidirectional Text Control (Bidi)
          0x200E, 0x200F, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066,
          0x2067, 0x2068, 0x2069
        ),
        fc.constantFrom('dec', 'hex', 'raw')
      ).map(([code, type]) => {
        if (type === 'dec') {
          return `&#${code};`;
        }
        if (type === 'hex') {
          return `&#x${code.toString(16).toUpperCase()};`;
        }
        return String.fromCodePoint(code);
      });

      fc.assert(
        fc.property(
          fc.constantFrom('javascript', 'vbscript'),
          fc.array(unicodeCtrlArb, { minLength: 1, maxLength: 3 }),
          fc.string({ maxLength: 100 }),
          (scheme, ctrls, suffix) => {
            const mid = Math.floor(scheme.length / 2);
            const obfuscatedScheme =
              scheme.slice(0, mid) + ctrls.join('') + scheme.slice(mid);
            const dataUrl = `data:text/html,${obfuscatedScheme}:alert(1)`;
            try {
              const res = sanitizeURLSync(dataUrl, { allow: ['data'] });
              if (res !== null) {
                const cleanRes =
                  res.replace(/[\x00-\x20\x7F]/g, '').toLowerCase();
                if (cleanRes.includes('javascript:') ||
                    cleanRes.includes('vbscript:')) {
                  console.error(
                    'Bypass detected via Unicode control character in data URL:',
                    dataUrl, 'Result:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              if (e.message !== 'Character references nested too deeply.') {
                console.error(
                  'Unhandled crash in data URL with Unicode control char:',
                  dataUrl, e
                );
                return false;
              }
            }
            const directUrl = `${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res) {
                const cleanDirect =
                  res.replace(/[\x00-\x20\x7F]/g, '').toLowerCase();
                if (cleanDirect.startsWith('javascript:') ||
                  cleanDirect.startsWith('vbscript:')) {
                  console.error(
                    'Bypass detected via direct obfuscated URL (Unicode):',
                    directUrl, 'Result:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error(
                'Unhandled crash in direct URL with Unicode control char:',
                directUrl, e
              );
              return false;
            }
            return true;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
