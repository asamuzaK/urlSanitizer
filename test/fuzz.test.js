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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
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
                   res.startsWith('vbscript:') ||
                   res.startsWith('data:'))
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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
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
                if (
                  cleanDirect.startsWith('javascript:') ||
                  cleanDirect.startsWith('vbscript:') ||
                  cleanDirect.startsWith('data:')
                ) {
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
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });

    it('should correctly handle %xx URL encoded bypass attempts', () => {
      const percentHexArb = fc.tuple(
        fc.constantFrom(
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
          16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127,
          0x6a, 0x61, 0x76, 0x61, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3a,
          0x76, 0x62
        ),
        fc.constantFrom('lower', 'upper')
      ).map(([code, casing]) => {
        const hex = code.toString(16);
        const formattedHex = hex.length === 1 ? `0${hex}` : hex;
        return casing === 'upper'
          ? `%${formattedHex.toUpperCase()}`
          : `%${formattedHex.toLowerCase()}`;
      });
      const safeDecode = (str) => {
        try {
          return decodeURIComponent(str);
        } catch (e) {
          return str;
        }
      };
      fc.assert(
        fc.property(
          fc.constantFrom('javascript', 'vbscript'),
          fc.array(percentHexArb, { minLength: 1, maxLength: 3 }),
          fc.string({ maxLength: 100 }),
          (scheme, pctCtrls, suffix) => {
            const mid = Math.floor(scheme.length / 2);
            const obfuscatedScheme =
              scheme.slice(0, mid) + pctCtrls.join('') + scheme.slice(mid);
            const directUrl = `${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res) {
                const decoded = safeDecode(res);
                const cleanDirect = decoded
                  .replace(/[\x00-\x20\x7F]/g, '')
                  .toLowerCase();
                if (
                  cleanDirect.startsWith('javascript:') ||
                  cleanDirect.startsWith('vbscript:') ||
                  cleanDirect.startsWith('data:')
                ) {
                  console.error(
                    'Bypass detected via %xx obfuscated URL:',
                    directUrl, 'Result:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error(
                'Unhandled crash in direct URL with %xx encoding:',
                directUrl, e
              );
              return false;
            }
            const fullyEncodedScheme = Array.from(scheme)
              .map(char => `%${char.charCodeAt(0).toString(16)}`)
              .join('');
            const fullEncodedUrl = `${fullyEncodedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(fullEncodedUrl, {
                allowRelative: true
              });
              if (res) {
                const decoded = safeDecode(res);
                const cleanFullyEncoded = decoded
                  .replace(/[\x00-\x20\x7F]/g, '')
                  .toLowerCase();
                if (
                  cleanFullyEncoded.startsWith('javascript:') ||
                  cleanFullyEncoded.startsWith('vbscript:') ||
                  cleanFullyEncoded.startsWith('data:')
                ) {
                  console.error(
                    'Bypass detected via fully %xx encoded scheme:',
                    fullEncodedUrl, 'Result:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error(
                'Unhandled crash in fully %xx encoded URL:',
                fullEncodedUrl, e
              );
              return false;
            }
            return true;
          }
        ),
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });

    it('should correctly handle entity reference bypass attempts', () => {
      const entityArb = fc.tuple(
        fc.constantFrom(
          0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21,
          22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127,
          0x6a, 0x61, 0x76, 0x61, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3a
        ),
        fc.constantFrom('dec', 'hex')
      ).map(([code, type]) => {
        return type === 'dec'
          ? `&#${code};`
          : `&#x${code.toString(16).toUpperCase()};`;
      });
      const nestEntity = (entityStr, depth) => {
        let result = entityStr;
        for (let i = 0; i < depth; i++) {
          result = result.replace(/&/g, '&amp;');
        }
        return result;
      };
      const fullyDecodeHTML = (str) => {
        if (typeof str !== 'string') {
          return '';
        }
        let prev;
        let current = str;
        let safetyCounter = 0;
        do {
          prev = current;
          current = current
            .replace(/&amp;/gi, '&')
            .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
              try {
                return String.fromCodePoint(parseInt(hex, 16));
              } catch {
                return '';
              }
            })
            .replace(/&#(\d+);/g, (_, dec) => {
              try {
                return String.fromCodePoint(parseInt(dec, 10));
              } catch {
                return '';
              }
            });
          safetyCounter++;
        } while (current !== prev && safetyCounter < 10);
        return current;
      };

      fc.assert(
        fc.property(
          fc.constantFrom('javascript', 'vbscript'),
          fc.array(entityArb, { minLength: 1, maxLength: 3 }),
          fc.integer({ min: 1, max: 3 }),
          fc.string({ maxLength: 100 }),
          (scheme, entities, depth, suffix) => {
            const nestedEntities =
              entities.map(e => nestEntity(e, depth)).join('');
            const mid = Math.floor(scheme.length / 2);
            const obfuscatedScheme =
              scheme.slice(0, mid) + nestedEntities + scheme.slice(mid);
            const dataUrl = `data:text/html,${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(dataUrl, { allow: ['data'] });
              if (res && typeof res === 'string') {
                const flatDecoded = fullyDecodeHTML(res);
                const cleanRes =
                  flatDecoded.replace(/[\x00-\x20\x7F]/g, '').toLowerCase();
                if (cleanRes.includes('javascript:') ||
                    cleanRes.includes('vbscript:')) {
                  console.error(
                    `Bypass detected via nested entity (depth: ${depth}) in data URL:`,
                    dataUrl, 'Result:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              if (e.message !== 'Character references nested too deeply.') {
                console.error('Unhandled crash in data URL with nested entity:',
                  dataUrl, e);
                return false;
              }
            }
            const fullyNestedScheme = Array.from(scheme)
              .map(char => nestEntity(`&#${char.charCodeAt(0)};`, depth))
              .join('');
            const directUrl = `${fullyNestedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res && typeof res === 'string') {
                const flatDecoded = fullyDecodeHTML(res);
                const cleanDirect =
                  flatDecoded.replace(/[\x00-\x20\x7F]/g, '').toLowerCase();
                if (
                  cleanDirect.startsWith('javascript:') ||
                  cleanDirect.startsWith('vbscript:') ||
                  cleanDirect.startsWith('data:')
                ) {
                  console.error(
                    `Bypass detected via direct nested entity URL (depth: ${depth}):`,
                    directUrl, 'Result:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error(
                'Unhandled crash in direct URL with nested entity:',
                directUrl, e);
              return false;
            }
            return true;
          }
        ),
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });

    it('should correctly handle Unicode normalization bypass attempts', () => {
      const unicodeSchemeArb =
        fc.constantFrom('javascript', 'vbscript').chain(scheme =>
          fc.array(fc.boolean(), {
            minLength: scheme.length,
            maxLength: scheme.length
          }).map(bools => {
            return Array.from(scheme).map((char, i) => {
              return bools[i]
                ? String.fromCharCode(char.charCodeAt(0) + 0xFEE0)
                : char;
            }).join('');
          })
        );
      const safeDecode = (str) => {
        try {
          return decodeURIComponent(str);
        } catch (e) {
          return str;
        }
      };

      fc.assert(
        fc.property(
          unicodeSchemeArb,
          fc.string({ maxLength: 100 }),
          (obfuscatedScheme, suffix) => {
            if (obfuscatedScheme === 'javascript' ||
                obfuscatedScheme === 'vbscript') {
              return true;
            }
            const directUrl = `${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res) {
                const decoded = safeDecode(res);
                const normalized = decoded
                  .normalize('NFKC')
                  .replace(/[\x00-\x20\x7F]/g, '')
                  .toLowerCase();
                if (
                  normalized.startsWith('javascript:') ||
                  normalized.startsWith('vbscript:') ||
                  normalized.startsWith('data:')
                ) {
                  console.error(
                    'Bypass detected via Unicode Normalization URL:',
                    directUrl, '\nResult:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error(
                'Unhandled crash in Unicode obfuscated URL:', directUrl, e);
              return false;
            }
            const dataUrl = `data:text/html,${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(dataUrl, { allow: ['data'] });
              if (res && typeof res === 'string') {
                const decoded = safeDecode(res);
                const normalized = decoded
                  .normalize('NFKC')
                  .replace(/[\x00-\x20\x7F]/g, '')
                  .toLowerCase();
                if (normalized.includes('javascript:') ||
                    normalized.includes('vbscript:')) {
                  console.error(
                    'Bypass detected via Unicode Normalization Data URL:',
                    dataUrl, '\nResult:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              if (e.message !== 'Character references nested too deeply.') {
                console.error('Unhandled crash in Unicode obfuscated Data URL:',
                  dataUrl, e);
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });

    it('should correctly handle mixed encoding bypass attempts', () => {
      const encodeTypes = ['raw', 'url', 'dec', 'hex', 'url_dec', 'url_hex'];
      const mixedSchemeArb =
        fc.constantFrom('javascript', 'vbscript').chain(scheme => {
          return fc.array(fc.constantFrom(...encodeTypes), {
            minLength: scheme.length,
            maxLength: scheme.length
          }).map(encodings => {
            return Array.from(scheme).map((char, i) => {
              const code = char.charCodeAt(0);
              const hex = code.toString(16);
              switch (encodings[i]) {
                case 'url': {
                  return `%${hex}`; // %6a
                }
                case 'dec': {
                  return `&#${code};`; // &#106;
                }
                case 'hex': {
                  return `&#x${hex};`; // &#x6a;
                }
                case 'url_dec': {
                  return `%26%23${code}%3B`; // %26%23106%3B
                }
                case 'url_hex': {
                  return `%26%23x${hex}%3B`; // %26%23x6a%3B
                }
                case 'raw':
                default: {
                  return char;
                }
              }
            }).join('');
          });
        });

      const fullyDecode = (str) => {
        if (typeof str !== 'string') return '';
        let prev;
        let current = str;
        let loops = 0;
        do {
          prev = current;
          try {
            current = decodeURIComponent(current);
          } catch {
            /* ignore */
          }
          current = current
            .replace(/&amp;/gi, '&')
            .replace(/&#x([0-9a-f]+);?/gi, (_, h) => {
              try {
                return String.fromCodePoint(parseInt(h, 16));
              } catch {
                return '';
              }
            }).replace(/&#(\d+);?/g, (_, d) => {
              try {
                return String.fromCodePoint(parseInt(d, 10));
              } catch {
                return '';
              }
            });
          loops++;
        } while (current !== prev && loops < 10);
        return current.replace(/[\x00-\x20\x7F]/g, '').toLowerCase();
      };

      fc.assert(
        fc.property(
          mixedSchemeArb,
          fc.string({ maxLength: 100 }),
          (obfuscatedScheme, suffix) => {
            if (obfuscatedScheme === 'javascript' ||
                obfuscatedScheme === 'vbscript') {
              return true;
            }
            const directUrl = `${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res) {
                const decoded = fullyDecode(res);
                if (
                  decoded.startsWith('javascript:') ||
                  decoded.startsWith('vbscript:') ||
                  decoded.startsWith('data:')
                ) {
                  console.error(
                    'Bypass detected via Mixed Encoding URL:',
                    directUrl, '\nResult:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error('Unhandled crash in Mixed Encoding URL:',
                directUrl, e);
              return false;
            }
            const dataUrl = `data:text/html,${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(dataUrl, { allow: ['data'] });
              if (res && typeof res === 'string') {
                const decoded = fullyDecode(res);
                if (decoded.includes('javascript:') ||
                  decoded.includes('vbscript:') ||
                  decoded.includes('data:')) {
                  console.error(
                    'Bypass detected via Mixed Encoding Data URL:',
                    dataUrl, '\nResult:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              if (e.message !== 'Character references nested too deeply.') {
                console.error('Unhandled crash in Mixed Encoding Data URL:',
                  dataUrl, e);
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });

    it('should correctly handle scheme splitting bypass attempts', () => {
      const splitters = [
        '', '\t', '\n', '\r',
        '%09', '%0A', '%0D', '%0a', '%0d',
        '&#9;', '&#10;', '&#13;',
        '&#x9;', '&#xA;', '&#xD;', '&#xa;', '&#xd;'
      ];
      const splitSchemeArb =
        fc.constantFrom('javascript', 'vbscript').chain(scheme => {
          return fc.array(fc.constantFrom(...splitters), {
            minLength: scheme.length + 1,
            maxLength: scheme.length + 1
          }).map(s => {
            let result = s[0];
            for (let i = 0; i < scheme.length; i++) {
              result += scheme[i] + s[i + 1];
            }
            return result;
          });
        });
      const fullyDecodeAndStrip = (str) => {
        if (typeof str !== 'string') {
          return '';
        }
        let prev;
        let current = str;
        let loops = 0;
        do {
          prev = current;
          try {
            current = decodeURIComponent(current);
          } catch {
            /* ignore */
          }
          current = current
            .replace(/&amp;/gi, '&')
            .replace(/&#x([0-9a-f]+);?/gi, (_, h) => {
              try {
                return String.fromCodePoint(parseInt(h, 16));
              } catch {
                return '';
              }
            })
            .replace(/&#(\d+);?/g, (_, d) => {
              try {
                return String.fromCodePoint(parseInt(d, 10));
              } catch {
                return '';
              }
            });
          loops++;
        } while (current !== prev && loops < 10);
        return current.replace(/[\n\r\t\0]/g, '').toLowerCase();
      };

      fc.assert(
        fc.property(
          splitSchemeArb,
          fc.string({ maxLength: 100 }),
          (obfuscatedScheme, suffix) => {
            if (obfuscatedScheme === 'javascript' ||
                obfuscatedScheme === 'vbscript') {
              return true;
            }
            const directUrl = `${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(directUrl, { allowRelative: true });
              if (res) {
                const decoded = fullyDecodeAndStrip(res);
                if (
                  decoded.startsWith('javascript:') ||
                  decoded.startsWith('vbscript:') ||
                  decoded.startsWith('data:')
                ) {
                  console.error(
                    'Bypass detected via Scheme Splitting URL:',
                    directUrl, '\nResult:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              console.error(
                'Unhandled crash in Scheme Splitting URL:',
                directUrl, e
              );
              return false;
            }
            const dataUrl = `data:text/html,${obfuscatedScheme}:${suffix}`;
            try {
              const res = sanitizeURLSync(dataUrl, { allow: ['data'] });
              if (res && typeof res === 'string') {
                const decoded = fullyDecodeAndStrip(res);
                if (decoded.includes('javascript:') ||
                    decoded.includes('vbscript:') ||
                    decoded.includes('data:')) {
                  console.error(
                    'Bypass detected via Scheme Splitting Data URL:',
                    dataUrl, '\nResult:', res
                  );
                  return false;
                }
              }
            } catch (e) {
              if (e.message !== 'Character references nested too deeply.') {
                console.error(
                  'Unhandled crash in Scheme Splitting Data URL:', dataUrl, e
                );
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });

    it('should correctly handle various relative URLs', () => {
      const prefixArb = fc.constantFrom(
        '/', './', '../', '', '?', '#', 
        '//', '\\\\', '/\\', '\\/', '\t//', ' //', '%2F%2F'
      );
      const relativeUrlArb = fc.tuple(
        prefixArb,
        fc.webPath(),
        fc.oneof(fc.webQueryParameters(), fc.constant('')),
        fc.oneof(fc.webFragments(), fc.constant(''))
      ).map(([prefix, path, query, hash]) => {
        const q = query ? `?${query}` : '';
        const h = hash ? `#${hash}` : '';
        return `${prefix}${path}${q}${h}`;
      });

      fc.assert(
        fc.property(relativeUrlArb, (relativeUrl) => {
          try {
            const res = sanitizeURLSync(relativeUrl, { allowRelative: true });
            const isProtocolRelative = /^[/\\]{2,}/.test(relativeUrl.trim());
            if (isProtocolRelative && res !== null) {
              console.error(
                'Bypass detected! Protocol-relative URL allowed:',
                relativeUrl, '\nResult:', res
              );
              return false;
            }
            return true;
          } catch (e) {
            console.error('Unhandled crash with relative URL:', relativeUrl, e);
            return false;
          }
        }),
        { numRuns: 1000, verbose: fc.VerbosityLevel.Verbose }
      );
    });
  });
});
