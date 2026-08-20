/**
 * utility.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';

/* test */
import * as mjs from '../src/mjs/utility.js';

describe('uri-util', () => {
  describe('normalize URL', () => {
    const func = mjs.normalizeURL;

    it('returns null if the given url is not a string', () => {
      assert.strictEqual(func(123), null, 'result for number');
      assert.strictEqual(func(null), null, 'result for null');
      assert.strictEqual(func(undefined), null, 'result for undefined');
      assert.strictEqual(func({}), null, 'result for object');
    });

    it('returns the same string for already normalized scheme', () => {
      const res = func('https');
      assert.strictEqual(res, 'https', 'result');
    });

    it('converts uppercase characters to lowercase', () => {
      const res = func('HTTPS', true);
      assert.strictEqual(res, 'https', 'result');
    });

    it('trims leading and trailing whitespaces', () => {
      const res = func('  http  ', true);
      assert.strictEqual(res, 'http', 'result');
    });

    it('trims whitespaces and converts to lowercase simultaneously', () => {
      const res = func('  Moz-Extension  ', true);
      assert.strictEqual(res, 'moz-extension', 'result');
    });

    it('normalizes the URL string using NFKC', () => {
      // Fullwidth string: 'ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｃｏｍ'
      const fullwidthUrl =
        '\uFF48\uFF54\uFF54\uFF50\uFF53\uFF1A\uFF0F\uFF0F\uFF45\uFF58\uFF41\uFF4D\uFF50\uFF4C\uFF45\uFF0E\uFF43\uFF4F\uFF4D';
      const res = func(fullwidthUrl);
      assert.strictEqual(res, 'https://example.com', 'result');
    });
  });

  describe('parse URL', () => {
    const func = mjs.parseURL;

    it('returns null if url is not a string', () => {
      assert.strictEqual(func(123), null, 'result for number');
      assert.strictEqual(func(null), null, 'result for null');
      assert.strictEqual(func(undefined), null, 'result for undefined');
    });

    it('returns null for an invalid URL string', () => {
      assert.strictEqual(func('not-a-valid-url'), null, 'result');
    });

    it('returns a parsed URL object for a relative URL with base URL', () => {
      const res = func('/path?query=1#hash', 'https://example.com');
      assert.ok(res instanceof URL, 'returns a URL instance');
      assert.strictEqual(res.protocol, 'https:', 'protocol');
      assert.strictEqual(res.hostname, 'example.com', 'hostname');
      assert.strictEqual(res.pathname, '/path', 'pathname');
    });

    it('returns a parsed URL object for a valid URL', () => {
      const res = func('https://example.com/path?query=1#hash');
      assert.ok(res instanceof URL, 'returns a URL instance');
      assert.strictEqual(res.protocol, 'https:', 'protocol');
      assert.strictEqual(res.hostname, 'example.com', 'hostname');
      assert.strictEqual(res.pathname, '/path', 'pathname');
    });

    it('returns a parsed URL object for normalized URL', () => {
      const res = func(
        'ＨＴＴＰＳ://example.com/path?query=1#hash',
        null,
        true
      );
      assert.ok(res instanceof URL, 'returns a URL instance');
      assert.strictEqual(res.protocol, 'https:', 'protocol');
      assert.strictEqual(res.hostname, 'example.com', 'hostname');
      assert.strictEqual(res.pathname, '/path', 'pathname');
    });

    it('returns a parsed URL object for normalized relative URL', () => {
      const res = func('/path?query=1#hash', 'ＨＴＴＰＳ://example.com', true);
      assert.ok(res instanceof URL, 'returns a URL instance');
      assert.strictEqual(res.protocol, 'https:', 'protocol');
      assert.strictEqual(res.hostname, 'example.com', 'hostname');
      assert.strictEqual(res.pathname, '/path', 'pathname');
    });
  });

  describe('parse URL fallback', () => {
    const func = mjs.parseURL;
    let originalURLParse;
    beforeEach(() => {
      originalURLParse = globalThis.URL.parse;
    });
    afterEach(() => {
      globalThis.URL.parse = originalURLParse;
    });

    it('uses URL.parse when available (modern environments)', () => {
      let isParseCalled = false;
      globalThis.URL.parse = (url, base) => {
        isParseCalled = true;
        return base !== undefined
          ? new globalThis.URL(url, base)
          : new globalThis.URL(url);
      };
      const res = func('https://example.com/modern');
      assert.strictEqual(isParseCalled, true, 'URL.parse should be executed');
      assert.ok(res instanceof URL, 'returns a URL instance');
      assert.strictEqual(res.href, 'https://example.com/modern', 'href');
    });

    it('falls back to new URL() when URL.parse is not available', () => {
      globalThis.URL.parse = undefined;
      const res = func('https://example.com/fallback');
      assert.ok(
        res instanceof globalThis.URL,
        'returns a URL instance via fallback'
      );
      assert.strictEqual(res.href, 'https://example.com/fallback', 'href');
    });

    it('falls back to new URL(uri, base)', () => {
      globalThis.URL.parse = undefined;
      const res = func('/path', 'https://example.com');
      assert.ok(
        res instanceof globalThis.URL,
        'returns a URL instance via fallback'
      );
      assert.strictEqual(res.href, 'https://example.com/path', 'href');
    });

    it('returns null if fallback throws an error for invalid URI', () => {
      globalThis.URL.parse = undefined;
      const res = func('/invalid-without-base');
      assert.strictEqual(res, null, 'returns null on fallback error');
    });
  });

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

    it('returns the same string when string length is equal to or less', () => {
      const exact64Chars = 'a'.repeat(64);
      assert.strictEqual(func(exact64Chars), exact64Chars);
      const shortString = 'https://example.com/short';
      assert.strictEqual(func(shortString), shortString);
    });

    it('truncates the string and appends "..." when length exceeds', () => {
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

    it('returns original base64 if decoded text contains control chars', () => {
      const binaryText = 'Hello\x00World';
      const base64Data = btoa(binaryText); // "SGVsbG8AV29ybGQ="
      const res = func(base64Data);
      assert.strictEqual(res, base64Data, 'result');
    });

    it('returns decoded text if it only contains control characters', () => {
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

      it('decodes base64 using Uint8Array fallback', () => {
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
      for (let i = 0; i < 14; i++) {
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
      for (let i = 0; i < 15; i++) {
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

    it('does not remove fragments or query', () => {
      assert.strictEqual(
        func('https://example.com#bar'),
        'https://example.com#bar',
        'fragment'
      );
      assert.strictEqual(
        func('https://example.com?bar'),
        'https://example.com?bar',
        'query'
      );
    });

    it('removes trailing empty hash fragments', () => {
      assert.strictEqual(
        func('https://example.com#'),
        'https://example.com',
        'removes fragment'
      );
      assert.strictEqual(
        func('https://example.com%23'),
        'https://example.com%23',
        'does not remove'
      );
    });

    it('removes trailing empty query strings', () => {
      assert.strictEqual(
        func('https://example.com?'),
        'https://example.com',
        'removes empty query'
      );
      assert.strictEqual(
        func('https://example.com%3F'),
        'https://example.com%3F',
        'does not remove'
      );
    });

    it('removes trailing empty query followed by empty hash', () => {
      assert.strictEqual(
        func('https://example.com?#'),
        'https://example.com',
        'removes empty query and empty hash'
      );
      assert.strictEqual(
        func('https://example.com%3F%23'),
        'https://example.com%3F%23',
        'does not remove'
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

    it('returns original string if no trailing empty hash or query', () => {
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

  describe('extract Data URL components', () => {
    const func = mjs.extractDataURLComponents;

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

    it('returns components with empty data if no comma is found', () => {
      const res = func('text/plain;charset=utf-8');
      assert.strictEqual(
        res.mediaType,
        'text/plain;charset=utf-8',
        'mediaType'
      );
      assert.deepEqual(
        res.mediaTypes,
        ['text/plain', 'charset=utf-8'],
        'mediaTypes'
      );
      assert.strictEqual(res.data, '', 'data');
      assert.strictEqual(res.isBase64, false, 'isBase64');
    });
  });
});
