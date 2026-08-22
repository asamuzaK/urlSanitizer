/**
 * scheme.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with { type: 'json' };
import * as mjs from '../src/mjs/scheme.js';

describe('scheme', () => {
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

    describe('get scheme', () => {
      it('returns null if uri is not a string', () => {
        const schemes = new URISchemes();
        assert.strictEqual(schemes.getScheme(123), null, 'result for number');
        assert.strictEqual(schemes.getScheme(null), null, 'result for null');
        assert.strictEqual(
          schemes.getScheme(undefined),
          null,
          'result for undefined'
        );
        assert.strictEqual(schemes.getScheme({}), null, 'result for object');
      });

      it('returns null for an invalid URI string', () => {
        const schemes = new URISchemes();
        assert.strictEqual(
          schemes.getScheme('invalid-uri-without-scheme'),
          null,
          'result'
        );
      });

      it('returns the scheme without trailing colon for a valid standard URI', () => {
        const schemes = new URISchemes();
        assert.strictEqual(
          schemes.getScheme('https://example.com'),
          'https',
          'result for https'
        );
        assert.strictEqual(
          schemes.getScheme('file:///C:/Users/Foo/'),
          'file',
          'result for file'
        );
      });

      it('returns the scheme for a valid compound custom URI', () => {
        const schemes = new URISchemes();
        assert.strictEqual(
          schemes.getScheme('git+ssh://example.com/repo.git'),
          'git+ssh',
          'result for git+ssh'
        );
      });

      it('returns the scheme for a data URI', () => {
        const schemes = new URISchemes();
        assert.strictEqual(
          schemes.getScheme('data:text/plain;base64,SGVsbG8='),
          'data',
          'result for data'
        );
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
        const res = schemes.normalize('HTTPS', true);
        assert.strictEqual(res, 'https', 'result');
      });

      it('trims leading and trailing whitespaces', () => {
        const schemes = new URISchemes();
        const res = schemes.normalize('  http  ', true);
        assert.strictEqual(res, 'http', 'result');
      });

      it('trims whitespaces and converts to lowercase simultaneously', () => {
        const schemes = new URISchemes();
        const res = schemes.normalize('  Moz-Extension  ', true);
        assert.strictEqual(res, 'moz-extension', 'result');
      });

      it('normalizes the URL string using NFKC', () => {
        const schemes = new URISchemes();
        // Fullwidth string: 'ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｃｏｍ'
        const fullwidthUrl =
          '\uFF48\uFF54\uFF54\uFF50\uFF53\uFF1A\uFF0F\uFF0F\uFF45\uFF58\uFF41\uFF4D\uFF50\uFF4C\uFF45\uFF0E\uFF43\uFF4F\uFF4D';
        const res = schemes.normalize(fullwidthUrl);
        assert.strictEqual(res, 'https://example.com', 'result');
      });
    });

    describe('normalize schemes', () => {
      it('returns an empty array if schemes is not an array', () => {
        const schemes = new URISchemes();
        assert.deepEqual(
          schemes.normalizeSchemes(123),
          [],
          'result for number'
        );
        assert.deepEqual(schemes.normalizeSchemes(null), [], 'result for null');
        assert.deepEqual(
          schemes.normalizeSchemes(undefined),
          [],
          'result for undefined'
        );
        assert.deepEqual(schemes.normalizeSchemes({}), [], 'result for object');
      });

      it('returns an empty array for an empty array input', () => {
        const schemes = new URISchemes();
        assert.deepEqual(schemes.normalizeSchemes([]), [], 'result');
      });

      it('normalizes valid schemes in an array', () => {
        const schemes = new URISchemes();
        const input = ['  HTTP  ', 'HTTPS:', ' Moz-Extension '];
        const res = schemes.normalizeSchemes(input);
        assert.deepEqual(
          res,
          ['http', 'https', 'moz-extension'],
          'should trim, lower-case, and strip trailing colons'
        );
      });

      it('filters out non-string items and invalid scheme inputs', () => {
        const schemes = new URISchemes();
        const input = ['https', null, 123, undefined, '', 'http'];
        const res = schemes.normalizeSchemes(input);
        assert.deepEqual(
          res,
          ['https', 'http'],
          'should ignore non-string and empty values'
        );
      });
    });

    describe('parse URL', () => {
      it('returns null if url is not a string', () => {
        const schemes = new URISchemes();
        assert.strictEqual(schemes.parse(123), null, 'result for number');
        assert.strictEqual(schemes.parse(null), null, 'result for null');
        assert.strictEqual(
          schemes.parse(undefined),
          null,
          'result for undefined'
        );
      });

      it('returns null for an invalid URL string', () => {
        const schemes = new URISchemes();
        assert.strictEqual(schemes.parse('not-a-valid-url'), null, 'result');
      });

      it('returns a parsed URL object for a relative URL with base URL', () => {
        const schemes = new URISchemes();
        const res = schemes.parse('/path?query=1#hash', 'https://example.com');
        assert.ok(res instanceof URL, 'returns a URL instance');
        assert.strictEqual(res.protocol, 'https:', 'protocol');
        assert.strictEqual(res.hostname, 'example.com', 'hostname');
        assert.strictEqual(res.pathname, '/path', 'pathname');
      });

      it('returns a parsed URL object for a valid URL', () => {
        const schemes = new URISchemes();
        const res = schemes.parse('https://example.com/path?query=1#hash');
        assert.ok(res instanceof URL, 'returns a URL instance');
        assert.strictEqual(res.protocol, 'https:', 'protocol');
        assert.strictEqual(res.hostname, 'example.com', 'hostname');
        assert.strictEqual(res.pathname, '/path', 'pathname');
      });

      it('returns a parsed URL object for normalized URL', () => {
        const schemes = new URISchemes();
        const res = schemes.parse(
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
        const schemes = new URISchemes();
        const res = schemes.parse(
          '/path?query=1#hash',
          'https://example.com',
          true
        );
        assert.ok(res instanceof URL, 'returns a URL instance');
        assert.strictEqual(res.protocol, 'https:', 'protocol');
        assert.strictEqual(res.hostname, 'example.com', 'hostname');
        assert.strictEqual(res.pathname, '/path', 'pathname');
      });
    });

    describe('parse URL fallback', () => {
      const { URISchemes } = mjs;
      let originalURLParse;

      beforeEach(() => {
        originalURLParse = globalThis.URL.parse;
      });
      afterEach(() => {
        globalThis.URL.parse = originalURLParse;
      });

      it('uses URL.parse when available (modern environments)', () => {
        const schemes = new URISchemes();
        let isParseCalled = false;
        globalThis.URL.parse = (url, base) => {
          isParseCalled = true;
          return base !== undefined
            ? new globalThis.URL(url, base)
            : new globalThis.URL(url);
        };
        const res = schemes.parse('https://example.com/modern');
        assert.strictEqual(isParseCalled, true, 'URL.parse should be executed');
        assert.ok(res instanceof URL, 'returns a URL instance');
        assert.strictEqual(res.href, 'https://example.com/modern', 'href');
      });

      it('falls back to new URL() when URL.parse is not available', () => {
        const schemes = new URISchemes();
        globalThis.URL.parse = undefined;
        const res = schemes.parse('https://example.com/fallback');
        assert.ok(
          res instanceof globalThis.URL,
          'returns a URL instance via fallback'
        );
        assert.strictEqual(res.href, 'https://example.com/fallback', 'href');
      });

      it('falls back to new URL(uri, base)', () => {
        const schemes = new URISchemes();
        globalThis.URL.parse = undefined;
        const res = schemes.parse('/path', 'https://example.com');
        assert.ok(
          res instanceof globalThis.URL,
          'returns a URL instance via fallback'
        );
        assert.strictEqual(res.href, 'https://example.com/path', 'href');
      });

      it('returns null if fallback throws an error for invalid URI', () => {
        const schemes = new URISchemes();
        globalThis.URL.parse = undefined;
        const res = schemes.parse('/invalid-without-base');
        assert.strictEqual(res, null, 'returns null on fallback error');
      });
    });

    describe('verify URI', () => {
      it('returns false for missing input', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI();
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for plain string without scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for unregistered scheme format', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('foo:bar');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for scheme allowed by custom set', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('foo:bar', new Set(['foo']));
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for obfuscated javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('Javas&#99;ript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for absolute path traversal (/../)', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('/../');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for relative path traversal (../../)', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('../../');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for valid standard HTTPS URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('https://example.com');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid URL with surrounding whitespace', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI(' https://example.com ');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for URL with port, path, and query', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('https://example.com:8000/#foo?bar=baz');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for invalid URL with spaces in path', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('https://example.com foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for valid IPv4 URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('https://127.0.0.1');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid IPv6 URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('https://[::1]/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid file: URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('file:///C:/Users/Foo/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid mailto: URL', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('mailto:foo@example.com');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid ext+ custom scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('ext+foo://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for valid web+ custom scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('web+foo://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for ext+javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('ext+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+javascript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for ext+vbscript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI(
          'ext+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+vbscript: scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI(
          'web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for compounded valid schemes (e.g., git+https)', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('git+https://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false if compound scheme contains unregistered part', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('foo+https://example.com/');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false if compound scheme inner part is unregistered', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('git+foo://example.com/');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for URN scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('URN:ISBN:4-8399-0454-5');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false if scheme contains javascript execution', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false if scheme contains vbscript execution', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('ext+vbscript:msgbox(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for valid web+ custom scheme without scripts', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyURI('web+foo:bar');
        assert.strictEqual(res, true, 'result');
      });

      it('verifies against custom schemes set instead of default list', () => {
        const schemes = new URISchemes();
        const customSchemes = new Set(['foo', 'bar']);
        assert.strictEqual(
          schemes.verifyURI('foo:test'),
          false,
          'default false'
        );
        assert.strictEqual(
          schemes.verifyURI('foo:test', customSchemes),
          true,
          'custom true'
        );
        assert.strictEqual(
          schemes.verifyURI('baz:test', customSchemes),
          false,
          'custom false'
        );
      });
    });

    describe('verify scheme', () => {
      it('returns false for missing input', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme();
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for unregistered scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for scheme allowed by custom set', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('foo', new Set(['foo']));
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for javascript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('javascript');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for *+javascript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('https+javascript');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for javascript** scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('javascript+https');
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for obfuscated javascript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('Javas&#99;ript');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for registered scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('https');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for URL.protocol (with colon)', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('https:');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for scheme with surrounding whitespace', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme(' https ');
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for ext+* custom scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('ext+foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for ext+* scheme if allowed in custom Set', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('ext+foo', new Set(['ext+foo']));
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for ext+* scheme if custom schemes are allowed', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('ext+foo', null, true);
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for ext+javascript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('ext+javascript', null, true);
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for ext+vbscript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('ext+vbscript', null, true);
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+* custom scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('web+foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for web+* scheme if allowed in custom Set', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('web+foo', new Set(['web+foo']));
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for web+* scheme if custom schemes are allowed', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('web+foo', null, true);
        assert.strictEqual(res, true, 'result');
      });

      it('returns false for web+javascript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('web+javascript', null, true);
        assert.strictEqual(res, false, 'result');
      });

      it('returns false for web+vbscript scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('web+vbscript', null, true);
        assert.strictEqual(res, false, 'result');
      });

      it('returns true for compounded schemes (e.g., git+https)', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('git+https');
        assert.strictEqual(res, true, 'result');
      });

      it('returns true for URN scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verifyScheme('URN');
        assert.strictEqual(res, true, 'result');
      });

      it('verifies against custom schemes set instead of default list', () => {
        const schemes = new URISchemes();
        const customSchemes = new Set(['foo', 'bar']);
        assert.strictEqual(schemes.verifyScheme('foo'), false, 'default false');
        assert.strictEqual(
          schemes.verifyScheme('foo', customSchemes),
          true,
          'custom true'
        );
        assert.strictEqual(
          schemes.verifyScheme('baz', customSchemes),
          false,
          'custom false'
        );
      });
    });
  });
});
