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

  describe('truncate URL', () => {
    const func = mjs.truncateURL;

    it('returns the same string when string length is equal to or less than TRUNCATE_LENGTH', () => {
      const exact64Chars = 'a'.repeat(64);
      assert.strictEqual(func(exact64Chars), exact64Chars);
      const shortString = 'https://example.com/short';
      assert.strictEqual(func(shortString), shortString);
    });

    it('truncates the string and appends "..." when length exceeds TRUNCATE_LENGTH', () => {
      const longString = 'a'.repeat(65);
      const expected = `${'a'.repeat(64)}...`;
      assert.strictEqual(func(longString), expected);
    });

    it('converts non-string input to string before truncating', () => {
      const num = 12345;
      assert.strictEqual(func(num), '12345');
      const longArrayString = String(new Array(30).fill('abc'));
      const expected = `${longArrayString.slice(0, 64)}...`;
      assert.strictEqual(func(longArrayString), expected);
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

    describe('normalize scheme', () => {
      it('returns null if scheme is not a string', () => {
        const schemes = new URISchemes();
        assert.strictEqual(schemes.normalize(123), null, 'result for number');
        assert.strictEqual(schemes.normalize(null), null, 'result for null');
        assert.strictEqual(
          schemes.normalize(undefined),
          null,
          'result for undefined'
        );
        assert.strictEqual(schemes.normalize({}), null, 'result for object');
      });

      it('returns the same string for already normalized schemes', () => {
        const schemes = new URISchemes();
        const res = schemes.normalize('https');
        assert.strictEqual(res, 'https', 'result');
      });

      it('converts uppercase characters to lowercase', () => {
        const schemes = new URISchemes();
        const res = schemes.normalize('HTTPS');
        assert.strictEqual(res, 'https', 'result');
      });

      it('trims leading and trailing whitespaces', () => {
        const schemes = new URISchemes();
        const res = schemes.normalize('  http  ');
        assert.strictEqual(res, 'http', 'result');
      });

      it('trims whitespaces and converts to lowercase simultaneously', () => {
        const schemes = new URISchemes();
        const res = schemes.normalize('  Moz-Extension  ');
        assert.strictEqual(res, 'moz-extension', 'result');
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

  describe('fetch blob as data URL', () => {
    const func = mjs.fetchBlobAsDataURL;
    let originalFetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });
    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('falls back to default MAX_BLOB_SIZE if maxBlobSize is invalid or 0', async () => {
      const data = 'a'.repeat(10);
      const blob = new Blob([data], { type: 'text/plain' });
      globalThis.fetch = async () => {
        return {
          blob: async () => blob
        };
      };
      const res1 = await func('blob:https://example.com/test', 0);
      const res2 = await func('blob:https://example.com/test', -50);
      const res3 = await func('blob:https://example.com/test', 'invalid');
      assert.ok(res1.startsWith('data:'), 'should process normally with 0');
      assert.ok(
        res2.startsWith('data:'),
        'should process normally with negative value'
      );
      assert.ok(
        res3.startsWith('data:'),
        'should process normally with non-number'
      );
    });

    it('fetches a URL and successfully converts it to a data URL', async () => {
      const data = 'Hello, blob!';
      const blob = new Blob([data], { type: 'text/plain' });
      globalThis.fetch = async url => {
        return {
          blob: async () => blob
        };
      };
      const res = await func('blob:https://example.com/mock-uuid');
      const base64 = globalThis.Buffer.from(data).toString('base64');
      const expectedUrl = `data:text/plain;base64,${base64}`;
      assert.strictEqual(res, expectedUrl, 'result');
    });

    it('rejects if the fetch request fails', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Network error');
      };
      await assert.rejects(
        async () => {
          await func('blob:https://example.com/error-uuid');
        },
        TypeError,
        'Network error'
      );
    });

    it('rejects if the content length exceeds maxSize', async () => {
      const data = 'a'.repeat(100);
      const blob = new Blob([data], { type: 'text/plain' });
      globalThis.fetch = async url => {
        return {
          headers: {
            get: key => {
              if (key === 'content-length') {
                return blob.size;
              }
              return null;
            }
          }
        };
      };
      const maxSize = 50;
      await assert.rejects(
        async () => {
          await func('blob:https://example.com/large-blob', maxSize);
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

    it('rejects if the fetched blob size exceeds maxSize', async () => {
      const data = 'a'.repeat(100);
      const blob = new Blob([data], { type: 'text/plain' });
      globalThis.fetch = async url => {
        return {
          blob: async () => blob
        };
      };
      const maxSize = 50;
      await assert.rejects(
        async () => {
          await func('blob:https://example.com/large-blob', maxSize);
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

    it('handles Blob without MIME type using Buffer (blob.type is falsy)', async () => {
      const data = 'No MIME type text';
      const blob = new Blob([data]);
      globalThis.fetch = async () => {
        return {
          blob: async () => blob
        };
      };
      const res = await func('blob:https://example.com/no-mime-buffer');
      const base64 = globalThis.Buffer.from(data).toString('base64');
      assert.strictEqual(
        res,
        `data:base64,${base64}`,
        'should omit MIME type in data URL'
      );
    });

    describe('environment specific paths inside fetchBlobAsDataURL', () => {
      let envBuffer;
      let envFileReader;

      beforeEach(() => {
        envBuffer = globalThis.Buffer;
        envFileReader = globalThis.FileReader;
      });

      afterEach(() => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: envBuffer,
          writable: true,
          configurable: true
        });
        Object.defineProperty(globalThis, 'FileReader', {
          value: envFileReader,
          writable: true,
          configurable: true
        });
      });

      it('uses FileReader fallback if Buffer is unavailable', async () => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });

        const sampleDataURL = 'data:text/plain;base64,RmlsZVJlYWRlciE=';
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL() {
            setTimeout(() => {
              this.result = sampleDataURL;
              if (this.listeners.load) {
                this.listeners.load();
              }
            }, 0);
          }
        };
        globalThis.fetch = async () => ({
          blob: async () => new Blob(['FileReader!'], { type: 'text/plain' })
        });
        const res = await func('blob:https://example.com/filereader-mock');
        assert.strictEqual(res, sampleDataURL, 'result using FileReader');
      });

      it('uses btoa fallback if Buffer and FileReader are both unavailable', async () => {
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
        const data = 'btoa environment fallback!';
        globalThis.fetch = async () => ({
          blob: async () => new Blob([data], { type: 'text/plain' })
        });
        const res = await func('blob:https://example.com/btoa-mock');
        const expectedBase64 = btoa(data);
        assert.strictEqual(
          res,
          `data:text/plain;base64,${expectedBase64}`,
          'result using btoa'
        );
      });

      it('rejects when FileReader emits an error event', async () => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        const mockError = new Error('Mock FileReader Error');
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
            this.error = mockError;
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL() {
            setTimeout(() => {
              if (this.listeners.error) {
                this.listeners.error();
              }
            }, 0);
          }
        };
        globalThis.fetch = async () => ({
          blob: async () => new Blob(['test'], { type: 'text/plain' })
        });
        await assert.rejects(
          async () => {
            await func('blob:https://example.com/error-mock');
          },
          err => {
            assert.strictEqual(
              err.message,
              'Mock FileReader Error',
              'error message'
            );
            return true;
          }
        );
      });

      it('rejects with default DOMException when FileReader error is missing/falsy', async () => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
            this.error = null;
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL() {
            setTimeout(() => {
              if (this.listeners.error) {
                this.listeners.error();
              }
            }, 0);
          }
        };
        globalThis.fetch = async () => ({
          blob: async () => new Blob(['test'], { type: 'text/plain' })
        });
        await assert.rejects(
          async () => {
            await func('blob:https://example.com/fallback-error-mock');
          },
          err => {
            assert.ok(err instanceof DOMException, 'should be DOMException');
            assert.strictEqual(err.name, 'NotReadableError', 'error name');
            assert.strictEqual(
              err.message,
              'Failed to read Blob via FileReader.',
              'error message'
            );
            return true;
          }
        );
      });

      it('resolves with null when FileReader emits an abort event', async () => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL() {
            setTimeout(() => {
              if (this.listeners.abort) {
                this.listeners.abort();
              }
            }, 0);
          }
        };
        globalThis.fetch = async () => ({
          blob: async () => new Blob(['test'], { type: 'text/plain' })
        });
        const res = await func('blob:https://example.com/abort-mock');
        assert.strictEqual(res, null, 'should return null on abort');
      });

      it('handles Blob without MIME type using btoa fallback', async () => {
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
        const data = 'No MIME type text for btoa';
        const blob = new Blob([data]);
        globalThis.fetch = async () => ({
          blob: async () => blob
        });
        const res = await func('blob:https://example.com/no-mime-btoa');
        const expectedBase64 = btoa(data);
        assert.strictEqual(
          res,
          `data:base64,${expectedBase64}`,
          'should omit MIME type in data URL'
        );
      });
    });
  });

  describe('get scheme parts', () => {
    const func = mjs.getSchemeParts;

    it('returns empty array if argument is not a string', () => {
      assert.deepEqual(func(), [], 'result for undefined');
      assert.deepEqual(func(123), [], 'result for number');
      assert.deepEqual(func(null), [], 'result for null');
    });

    it('returns a single part for a simple protocol', () => {
      assert.deepEqual(func('https:'), ['https'], 'result');
    });

    it('returns multiple parts for a compound protocol', () => {
      assert.deepEqual(func('git+http:'), ['git', 'http'], 'result');
    });

    it('handles string without trailing colon', () => {
      assert.deepEqual(func('data'), ['data'], 'result');
    });
  });

  describe('get URL scheme', () => {
    const func = mjs.getURLScheme;

    it('returns undefined if argument is not a string', () => {
      assert.strictEqual(func(), undefined, 'result for undefined');
      assert.strictEqual(func(123), undefined, 'result for number');
      assert.strictEqual(func(null), undefined, 'result for null');
    });

    it('returns undefined for invalid URL string', () => {
      assert.strictEqual(func('foo'), undefined, 'result');
    });

    it('returns the scheme without trailing colon for a valid URL', () => {
      assert.strictEqual(func('https://example.com'), 'https', 'result');
    });

    it('returns the scheme for a data URL', () => {
      assert.strictEqual(func('data:text/plain,foo'), 'data', 'result');
    });
  });

  describe('extract Data URL components', () => {
    const func = mjs.extractDataUrlComponents;

    it('returns default object if pathname is not a string', () => {
      const expected = {
        mediaType: '',
        mediaTypes: [],
        data: '',
        isBase64: false
      };
      assert.deepEqual(func(), expected, 'result for undefined');
      assert.deepEqual(func(123), expected, 'result for number');
      assert.deepEqual(func(null), expected, 'result for null');
    });

    it('extracts components for a standard data URL without base64', () => {
      const res = func('text/html,<div>Hello</div>');
      assert.strictEqual(res.mediaType, 'text/html', 'mediaType');
      assert.deepEqual(res.mediaTypes, ['text/html'], 'mediaTypes');
      assert.strictEqual(res.data, '<div>Hello</div>', 'data');
      assert.strictEqual(res.isBase64, false, 'isBase64');
    });

    it('extracts components for a base64 encoded data URL', () => {
      const res = func('image/png;base64,iVBORw0KGgo=');
      assert.strictEqual(res.mediaType, 'image/png;base64', 'mediaType');
      assert.deepEqual(res.mediaTypes, ['image/png', 'base64'], 'mediaTypes');
      assert.strictEqual(res.data, 'iVBORw0KGgo=', 'data');
      assert.strictEqual(res.isBase64, true, 'isBase64');
    });

    it('appends search and hash to the extracted data', () => {
      const res = func('text/plain,hello', '?foo=bar', '#baz');
      assert.strictEqual(res.data, 'hello?foo=bar#baz', 'data');
    });

    it('handles missing search and hash components correctly', () => {
      const res = func('text/plain,hello');
      assert.strictEqual(res.data, 'hello', 'data with default parameters');
    });

    it('handles multiple commas correctly by preserving data parts', () => {
      const res = func('text/plain,hello,world,test');
      assert.strictEqual(
        res.data,
        'hello,world,test',
        'data with multiple commas'
      );
    });
  });
});
