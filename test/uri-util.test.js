/**
 * uri-util.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with { type: 'json' };
import * as mjs from '../src/mjs/uri-util.js';

describe('uri-util', () => {
  describe('get URL encoded string', () => {
    const func = mjs.getURLEncodedString;

    it('throws TypeError if argument is not a string', () => {
      assert.throws(
        () => func(),
        TypeError,
        'Expected String but got Undefined.'
      );
    });

    it('returns empty string for empty input', () => {
      const res = func('');
      assert.strictEqual(res, '', 'result');
    });

    it('returns URL-encoded string for regular text', () => {
      const res = func('foo bar');
      assert.strictEqual(res, '%66%6F%6F%20%62%61%72', 'result');
    });

    it('returns URL-encoded string for special characters', () => {
      const res = func('&#<>"\'');
      assert.strictEqual(res, '%26%23%3C%3E%22%27', 'result');
    });
  });

  describe('escape URL encoded HTML special chars', () => {
    const func = mjs.escapeURLEncodedHTMLChars;

    it('returns undefined if input is missing', () => {
      const res = func();
      assert.strictEqual(res, undefined, 'result');
    });

    it('returns original string if no escaping is needed', () => {
      const res = func('foo');
      assert.strictEqual(res, 'foo', 'result');
    });

    it('returns original string for non-target encoded sequences', () => {
      const res = func('%3g');
      assert.strictEqual(res, '%3g', 'result');
    });

    it('returns original string for space encoding (%20)', () => {
      const res = func('%20');
      assert.strictEqual(res, '%20', 'result');
    });

    it('escapes encoded ampersand (%26)', () => {
      const res = func('%26');
      assert.strictEqual(res, '%26amp;', 'result');
    });

    it('escapes encoded lowercase less-than (%3c)', () => {
      const res = func('%3c');
      assert.strictEqual(res, '%26lt;', 'result');
    });

    it('escapes encoded uppercase less-than (%3C)', () => {
      const res = func('%3C');
      assert.strictEqual(res, '%26lt;', 'result');
    });

    it('escapes encoded greater-than (%3E)', () => {
      const res = func('%3E');
      assert.strictEqual(res, '%26gt;', 'result');
    });

    it('escapes encoded double quote (%22)', () => {
      const res = func('%22');
      assert.strictEqual(res, '%26quot;', 'result');
    });

    it('escapes encoded single quote (%27)', () => {
      const res = func('%27');
      assert.strictEqual(res, '%26%2339;', 'result');
    });
  });

  describe('parse base64 encoded data', () => {
    const func = mjs.parseBase64;

    it('throws TypeError if argument is not a string', () => {
      assert.throws(
        () => func(),
        TypeError,
        'Expected String but got Undefined.'
      );
    });

    it('throws Error for invalid base64 data', () => {
      assert.throws(
        () => func('foo%20bar'),
        Error,
        'Invalid base64 data: foo%20bar'
      );
    });

    it('returns parsed base64 image data correctly', () => {
      const data =
        'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = func(data);
      assert.strictEqual(res, data, 'result');
    });

    it('returns decoded text from valid base64 input', () => {
      const data = 'Hello%2C%20World!';
      const base64Data = btoa(data);
      const res = func(base64Data);
      assert.strictEqual(res, data, 'result');
    });

    it('returns original base64 if decoded text contains binary control characters', () => {
      const binaryText = 'Hello\x00World';
      const base64Data = btoa(binaryText); // "SGVsbG8AV29ybGQ="
      const res = func(base64Data);
      assert.strictEqual(res, base64Data, 'result');
    });

    it('returns decoded text if it only contains valid text control characters (e.g., tabs, newlines)', () => {
      const validText = 'Hello\tWorld\n';
      const base64Data = btoa(validText);
      const res = func(base64Data);
      assert.strictEqual(res, validText, 'result');
    });

    describe('environment specific decoding optimizations', () => {
      it('decodes base64 using Buffer when available in Node.js', () => {
        assert.ok(
          globalThis.Buffer,
          'Buffer should be available in this environment'
        );
        const data = 'Hello, Node.js Buffer optimization!';
        const base64Data = btoa(data);
        const res = func(base64Data);
        assert.strictEqual(res, data, 'result');
      });

      it('decodes base64 using Uint8Array fallback when Buffer is unavailable', () => {
        const originalBuffer = globalThis.Buffer;
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        try {
          assert.strictEqual(
            globalThis.Buffer,
            undefined,
            'Buffer should be hidden'
          );
          const data = 'Hello, Uint8Array loop optimization!';
          const base64Data = btoa(data);
          const res = func(base64Data);
          assert.strictEqual(res, data, 'result');
        } finally {
          Object.defineProperty(globalThis, 'Buffer', {
            value: originalBuffer,
            writable: true,
            configurable: true
          });
        }
      });
    });
  });

  describe('replace numeric character reference', () => {
    const func = mjs.replaceNumCharRef;

    it('replaces decimal text character references', () => {
      // 44 is ','
      const res = func('&#44;', '44');
      assert.strictEqual(res, ',', 'result');
    });

    it('replaces hex text character references', () => {
      // 0x2C is ','
      const res = func('&#x2C;', 'x2C');
      assert.strictEqual(res, ',', 'result');
    });

    it('replaces uppercase hex text character references', () => {
      // 0x6F is 'o'
      const res = func('&#X006F;', 'X006F');
      assert.strictEqual(res, 'o', 'result');
    });

    it('strips decimal non-text control characters under 256', () => {
      // 0 is NULL
      const res = func('&#0;', '0');
      assert.strictEqual(res, '', 'result');
    });

    it('strips hex non-text control characters under 256', () => {
      // 0x01 is SOH (Start of Heading), a non-text control character
      const res = func('&#x01;', 'x01');
      assert.strictEqual(res, '', 'result');
    });

    it('returns original match for out-of-range text characters', () => {
      // 9829 is out of 0x00-0xFF range and not in text chars
      const res = func('&#9829;', '9829');
      assert.strictEqual(res, '&#9829;', 'result');
    });

    it('returns original match for invalid decimal values', () => {
      const res = func('&#foo;', 'foo');
      assert.strictEqual(res, '&#foo;', 'result');
    });

    it('returns original match for invalid hex values', () => {
      const res = func('&#xZZ;', 'xZZ');
      assert.strictEqual(res, '&#xZZ;', 'result');
    });

    it('maps Windows-1252 decimal references to Unicode characters', () => {
      const res = func('&#128;', '128');
      assert.strictEqual(res, '\u20AC', 'result');
    });

    it('maps Windows-1252 hex references to Unicode characters', () => {
      const res = func('&#x99;', 'x99');
      assert.strictEqual(res, '\u2122', 'result');
    });
  });

  describe('parse URL encoded numeric character reference', () => {
    const func = mjs.parseURLEncodedNumCharRef;

    it('throws TypeError if argument is not a string', () => {
      assert.throws(
        () => func(),
        TypeError,
        'Expected String but got Undefined.'
      );
    });

    it('throws TypeError if nest argument is not a number', () => {
      const str = 'Hello%2C%20World!';
      assert.throws(
        () => func(str, true),
        TypeError,
        'Expected Number but got Boolean.'
      );
    });

    it('decodes standard URL-encoded strings', () => {
      const str = 'Hello%2C%20World!';
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!', 'result');
    });

    it('decodes mixed URL-encoded and numeric character references', () => {
      const comma = '&#44;';
      const l = '&#108';
      const o = '&#0111;';
      const str = `He${l}${l}o${comma}%20W${o}r${l}d!`;
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!', 'result');
    });

    it('decodes hex, decimal, and strips non-text control characters', () => {
      const nul = '&#x00';
      const comma = '&#x2C;';
      const l = '&#x6C';
      const o = '&#x006F;';
      const heart = '&#9829;';
      const str = `He${l}${l}o${comma}%20${nul}W${o}r${l}d${heart}`;
      const res = func(str);
      assert.strictEqual(res, `Hello, World${heart}`, 'result');
    });

    it('decodes deeply nested character references within limit', () => {
      const amp = '&#x26;';
      const semi = '&#x3B;';
      let nest = amp;
      for (let i = 0; i < 15; i++) {
        nest = `${nest}#x26;`;
      }
      const str = `j${nest}#x61${semi}vascript:alert(1)`;
      const res = func(str);
      assert.strictEqual(res, 'javascript:alert(1)', 'result');
    });

    it('throws Error if character references exceed nesting limit', () => {
      const amp = '&#x26;';
      const semi = '&#x3B;';
      let nest = amp;
      for (let i = 0; i < 16; i++) {
        nest = `${nest}#x26;`;
      }
      const str = `j${nest}#x61${semi}vascript:alert(1)`;
      assert.throws(
        () => func(str),
        Error,
        'Character references nested too deeply.'
      );
    });

    it('falls back to partial decoding for malformed URI components', () => {
      const str = 'Hello%2C%20World!%';
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!%', 'result');
    });

    it('leaves invalid multi-byte sequences intact upon fallback', () => {
      const str = 'Hello%E0%A4-%20World!';
      const res = func(str);
      assert.strictEqual(res, 'Hello%E0%A4- World!', 'result');
    });

    it('successfully resolves URL-encoded HTML entities', () => {
      const str = 'j%26%23x61%3Bvascript:%';
      const res = func(str);
      assert.strictEqual(res, 'javascript:%', 'result');
    });
  });

  describe('convert blob to data URL', () => {
    const func = mjs.convertBlobToDataURL;

    it('returns null if input is undefined', async () => {
      const res = await func();
      assert.deepEqual(res, null, 'result');
    });

    it('returns null if input is an empty string', async () => {
      const res = await func('');
      assert.deepEqual(res, null, 'result');
    });

    it('returns null if input is a standard URL string', async () => {
      const res = await func('https://example.com');
      assert.deepEqual(res, null, 'result');
    });

    it('returns data URL for valid Blob', async () => {
      const data = '<p>Hello, world!</p>';
      const base64Data = btoa(data);
      const blob = new Blob([data], {
        type: 'text/html'
      });
      const res = await func(blob);
      assert.strictEqual(res, `data:text/html;base64,${base64Data}`, 'result');
    });

    it('returns null if input is an object URL', async () => {
      const data = '<p>Hello, world!</p>';
      const blob = new Blob([data], {
        type: 'text/html'
      });
      const url = URL.createObjectURL(blob);
      const res = await func(url);
      assert.deepEqual(res, null, 'result');
    });

    it('rejects with NotReadableError if Blob size exceeds maxSize', async () => {
      const data = 'a'.repeat(100);
      const blob = new Blob([data], { type: 'text/plain' });
      const maxSize = 50;
      await assert.rejects(
        async () => {
          await func(blob, maxSize);
        },
        err => {
          assert.strictEqual(err.name, 'NotReadableError', 'error name');
          assert.strictEqual(
            err.message,
            `Blob size (${blob.size} bytes) exceeds max (${maxSize} bytes).`,
            'error message'
          );
          return true;
        }
      );
    });

    it('converts Blob to data URL using Buffer in Node.js', async () => {
      assert.ok(
        globalThis.Buffer,
        'Buffer should be available in this environment'
      );
      const data = 'Hello, Node.js Buffer!';
      const blob = new Blob([data], {
        type: 'text/plain'
      });
      const base64 = globalThis.Buffer.from(data).toString('base64');
      const url = `data:text/plain;base64,${base64}`;
      const res = await func(blob);
      assert.strictEqual(res, url, 'result using convertFromBuffer');
    });

    it('handles Blob without MIME type using Buffer', async () => {
      assert.ok(
        globalThis.Buffer,
        'Buffer should be available in this environment'
      );
      const data = 'No MIME type text';
      const blob = new Blob([data]);
      const base64 = globalThis.Buffer.from(data).toString('base64');
      const url = `data:base64,${base64}`;
      const res = await func(blob);
      assert.strictEqual(res, url, 'result without MIME type');
    });

    describe('convert blob to data URL via FileReader path', () => {
      let originalBuffer;
      let originalFileReader;

      beforeEach(() => {
        originalBuffer = globalThis.Buffer;
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        originalFileReader = globalThis.FileReader;
      });

      afterEach(() => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: originalBuffer,
          writable: true,
          configurable: true
        });
        globalThis.FileReader = originalFileReader;
      });

      it('converts Blob to data URL using FileReader fallback', async () => {
        const sampleDataURL =
          'data:text/html;base64,PHA+SGVsbG8sIHdvcmxkITwvcD4=';
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL(blob) {
            setTimeout(() => {
              this.result = sampleDataURL;
              if (this.listeners.load) {
                this.listeners.load();
              }
            }, 0);
          }
        };
        const blob = new Blob(['<p>Hello, world!</p>'], { type: 'text/html' });
        const res = await func(blob);
        assert.strictEqual(res, sampleDataURL, 'should return data URL');
      });

      it('rejects when FileReader encounters an error', async () => {
        const mockError = new Error('Mock FileReader Read Error');
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
            this.error = mockError;
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL(blob) {
            setTimeout(() => {
              if (this.listeners.error) {
                this.listeners.error();
              }
            }, 0);
          }
        };
        const blob = new Blob(['test'], { type: 'text/plain' });
        await assert.rejects(
          async () => {
            await func(blob);
          },
          err => {
            assert.strictEqual(err.message, 'Mock FileReader Read Error');
            return true;
          },
          'should reject with error'
        );
      });
    });

    describe('convert blob to data URL via btoa path', () => {
      let originalBuffer;
      let originalFileReader;

      beforeEach(() => {
        originalBuffer = globalThis.Buffer;
        originalFileReader = globalThis.FileReader;
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        Object.defineProperty(globalThis, 'FileReader', {
          value: undefined,
          writable: true,
          configurable: true
        });
      });

      afterEach(() => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: originalBuffer,
          writable: true,
          configurable: true
        });
        Object.defineProperty(globalThis, 'FileReader', {
          value: originalFileReader,
          writable: true,
          configurable: true
        });
      });

      it('converts Blob to data URL using btoa fallback', async () => {
        assert.strictEqual(
          globalThis.Buffer,
          undefined,
          'Buffer should be hidden'
        );
        assert.strictEqual(
          globalThis.FileReader,
          undefined,
          'FileReader should be hidden'
        );
        const data = 'Hello, btoa fallback!';
        const blob = new Blob([data], {
          type: 'text/plain'
        });
        const base64 = btoa(data);
        const url = `data:text/plain;base64,${base64}`;
        const res = await func(blob);
        assert.strictEqual(res, url, 'result');
      });

      it('handles Blob without MIME type using btoa fallback', async () => {
        const data = 'No MIME type text for btoa';
        const blob = new Blob([data]);
        const base64 = btoa(data);
        const url = `data:base64,${base64}`;
        const res = await func(blob);
        assert.strictEqual(res, url, 'result without MIME type');
      });
    });
  });

  describe('trim trailing empty query and hash', () => {
    const func = mjs.trimTrailingEmptyQueryAndHash;

    it('removes trailing empty hash fragments', () => {
      assert.strictEqual(
        func('https://example.com#'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%23'),
        'https://example.com',
        'result'
      );
    });

    it('removes trailing empty query strings', () => {
      assert.strictEqual(
        func('https://example.com?'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%3F'),
        'https://example.com',
        'result'
      );
    });

    it('removes trailing empty query followed by empty hash', () => {
      assert.strictEqual(
        func('https://example.com?#'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%3F%23'),
        'https://example.com',
        'result'
      );
    });

    it('preserves question marks inside valid hash fragments', () => {
      assert.strictEqual(
        func('https://example.com#section?'),
        'https://example.com#section?',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%23section%3F'),
        'https://example.com%23section%3F',
        'result'
      );
      assert.strictEqual(
        func('https://example.com#?'),
        'https://example.com#?',
        'result'
      );
    });

    it('returns original string if no trailing empty hash or query exists', () => {
      assert.strictEqual(
        func('https://example.com'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('data:text/html,<div>'),
        'data:text/html,<div>',
        'result'
      );
    });

    it('returns original input if it is not a string', () => {
      assert.strictEqual(func(null), null, 'result');
      assert.strictEqual(func(undefined), undefined, 'result');
      assert.strictEqual(func(123), 123, 'result');
    });
  });

  describe('URI schemes', () => {
    const { URISchemes } = mjs;

    it('creates an instance of URISchemes', () => {
      const schemes = new URISchemes();
      assert.strictEqual(schemes instanceof URISchemes, true, 'instance');
    });

    describe('get schemes', () => {
      it('returns the list of registered schemes', () => {
        const schemes = new URISchemes();
        const res = schemes.get();
        assert.deepEqual(res, uriSchemes, 'result');
      });
    });

    describe('has scheme', () => {
      it('returns false if scheme is not a string', () => {
        const schemes = new URISchemes();
        const res1 = schemes.has(123);
        const res2 = schemes.has(null);
        const res3 = schemes.has(undefined);
        assert.strictEqual(res1, false, 'result for number');
        assert.strictEqual(res2, false, 'result for null');
        assert.strictEqual(res3, false, 'result for undefined');
      });

      it('returns true for standard HTTPS scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.has('https');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for moz-extension scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.has('moz-extension');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for unregistered scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.has('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for unregistered custom web+ scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.has('web+foo');
        assert.strictEqual(res, false, 'result');
      });
    });

    describe('is URI', () => {
      it('returns false for missing input', () => {
        const schemes = new URISchemes();
        const res = schemes.verify();
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for plain string without scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for unregistered scheme format', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo:bar');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for scheme allowed by custom set', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo:bar', new Set(['foo']));
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for obfuscated javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('Javas&#99;ript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for absolute path traversal (/../)', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('/../');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for relative path traversal (../../)', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('../../');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for valid standard HTTPS URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid URL with surrounding whitespace', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(' https://example.com ');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for URL with port, path, and query', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com:8000/#foo?bar=baz');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for invalid URL with spaces in path', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for valid IPv4 URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://127.0.0.1');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid IPv6 URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://[::1]/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid file: URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('file:///C:/Users/Foo/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid mailto: URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('mailto:foo@example.com');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid ext+ custom scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+foo://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid web+ custom scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+foo://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for ext+javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for ext+vbscript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(
          'ext+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+vbscript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(
          'web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for compounded valid schemes (e.g., git+https)', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('git+https://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false if compound scheme contains unregistered part', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo+https://example.com/');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false if compound scheme inner part is unregistered', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('git+foo://example.com/');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for URN scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('URN:ISBN:4-8399-0454-5');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false if scheme contains javascript execution', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false if scheme contains vbscript execution', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+vbscript:msgbox(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for valid web+ custom scheme without scripts', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+foo:bar');
        assert.strictEqual(res, true, 'result');
      });

      it('verifies against custom schemes set instead of default list', () => {
        const schemes = new URISchemes();
        const customSchemes = new Set(['foo', 'bar']);
        assert.strictEqual(schemes.verify('foo:test'), false, 'default false');
        assert.strictEqual(
          schemes.verify('foo:test', customSchemes),
          true,
          'custom true'
        );
        assert.strictEqual(
          schemes.verify('baz:test', customSchemes),
          false,
          'custom false'
        );
      });
    });
  });
});
