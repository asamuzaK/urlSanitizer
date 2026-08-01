/**
 * sanitizer.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { isString } from '../scripts/common.js';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with { type: 'json' };
import urlSanitizer, * as mjs from '../src/mjs/sanitizer.js';

describe('sanitizer', () => {
  describe('default', () => {
    it('is an instance of URLSanitizer', () => {
      assert.strictEqual(
        urlSanitizer instanceof mjs.URLSanitizer,
        true,
        'instance'
      );
    });
  });

  describe('logDebug', () => {
    const { logDebug } = mjs;
    let warnStub;
    beforeEach(() => {
      warnStub = sinon.stub(console, 'warn');
    });
    afterEach(() => {
      warnStub.restore();
    });

    it('logs message to console.warn when isDebug is true', () => {
      logDebug(true, 'Test message');
      assert.strictEqual(
        warnStub.calledOnce,
        true,
        'console.warn should be called once'
      );
      assert.strictEqual(
        warnStub.calledWith('[URLSanitizer Debug] Test message'),
        true,
        'should include error message'
      );
    });

    it('logs message and error details when isDebug is true', () => {
      const testError = new Error('Test error detail');
      logDebug(true, 'Test message', testError);
      assert.strictEqual(
        warnStub.calledOnce,
        true,
        'console.warn should be called once'
      );
      assert.strictEqual(
        warnStub.calledWith('[URLSanitizer Debug] Test message', testError),
        true,
        'should include error message and the original error'
      );
    });

    it('does not log message when isDebug is false', () => {
      logDebug(false, 'Test message');
      assert.strictEqual(
        warnStub.called,
        false,
        'console.warn should not be called'
      );
    });

    it('does not log error when isDebug is false', () => {
      const testError = new Error('Test error detail');
      logDebug(false, 'Test message', testError);
      assert.strictEqual(
        warnStub.called,
        false,
        'console.warn should not be called'
      );
    });
  });

  describe('SanitizeContext', () => {
    const { SanitizeContext } = mjs;

    it('initializes properties correctly with default options', () => {
      const mockDomPurify = {};
      const ctx = new SanitizeContext(undefined, mockDomPurify);
      assert.strictEqual(ctx.debug, false, 'debug should be false by default');
      assert.strictEqual(
        ctx.domPurify,
        mockDomPurify,
        'domPurify instance should match'
      );
      assert.strictEqual(ctx.nest, 0, 'nest should start at 0');
      assert.strictEqual(
        ctx.recurse instanceof Set,
        true,
        'recurse should be a Set instance'
      );
      assert.strictEqual(
        ctx.recurse.size,
        0,
        'recurse should be empty initially'
      );
      assert.strictEqual(
        ctx.schemeMap.get('blob'),
        false,
        'schemeMap should contain default schemes'
      );
    });

    it('initializes debug property correctly when opt.debug is true', () => {
      const ctx = new SanitizeContext({ debug: true }, {});
      assert.strictEqual(ctx.debug, true, 'debug should be true');
    });

    describe('enter() and leave()', () => {
      let warnStub;
      beforeEach(() => {
        warnStub = sinon.stub(console, 'warn');
      });
      afterEach(() => {
        warnStub.restore();
      });

      it('returns true, increments nest, and tracks URL on valid enter', () => {
        const ctx = new SanitizeContext({}, {});
        const url = 'data:text/html,test';
        const res = ctx.enter(url);
        assert.strictEqual(res, true, 'should return true for a new URL');
        assert.strictEqual(ctx.nest, 1, 'nest should be incremented to 1');
        assert.strictEqual(
          ctx.recurse.has(url),
          true,
          'URL should be tracked in recurse Set'
        );
      });

      it('returns false and logs debug message on circular reference', () => {
        const ctx = new SanitizeContext({ debug: true }, {});
        const url = 'data:text/html,loop';
        // First enter
        ctx.enter(url);
        // Second enter with the same URL (circular reference)
        const res = ctx.enter(url);
        assert.strictEqual(
          res,
          false,
          'should return false to block circular reference'
        );
        assert.strictEqual(
          ctx.nest,
          1,
          'nest should not be incremented further'
        );
        assert.strictEqual(
          warnStub.calledOnce,
          true,
          'console.warn should be called in debug mode'
        );
        assert.strictEqual(
          warnStub.firstCall.args[0],
          '[URLSanitizer Debug] Circular Data URL detected and skipped: data:text/html,loop',
          'should output the correct circular warning message'
        );
      });

      it('does not log debug message on circular reference if debug is false', () => {
        const ctx = new SanitizeContext({ debug: false }, {});
        const url = 'data:text/html,loop';
        ctx.enter(url);
        ctx.enter(url);
        assert.strictEqual(
          warnStub.called,
          false,
          'console.warn should not be called when debug is false'
        );
      });

      it('decrements nest and removes URL from tracking on leave', () => {
        const ctx = new SanitizeContext({}, {});
        const url = 'data:text/html,test';
        ctx.enter(url);
        ctx.leave(url);
        assert.strictEqual(ctx.nest, 0, 'nest should be decremented back to 0');
        assert.strictEqual(
          ctx.recurse.has(url),
          false,
          'URL should be removed from the recurse Set'
        );
      });
    });
  });

  describe('URL sanitizer', () => {
    const { URLSanitizer } = mjs;

    it('is an instance of URLSanitizer', () => {
      const sanitizer = new URLSanitizer();
      assert.strictEqual(sanitizer instanceof URLSanitizer, true, 'instance');
    });

    describe('sanitize URL', () => {
      it('returns null for empty input', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize();
        assert.deepEqual(res, null, 'result');
      });

      it('returns null for plain strings without a scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo');
        assert.deepEqual(res, null, 'result');
      });

      it('returns sanitized valid HTTPS URLs', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('ignores invalid string options and returns sanitized URL', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', 'foo');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('ignores null options and returns sanitized URL', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', null);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('encodes spaces in hash fragments', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'https://example.com:8000/#foo?bar=baz qux'
        );
        assert.strictEqual(
          res,
          'https://example.com:8000/#foo?bar=baz%20qux',
          'result'
        );
      });

      it('preserves valid query parameters', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com/?foo=bar&baz=qux');
        assert.strictEqual(
          res,
          'https://example.com/?foo=bar&baz=qux',
          'result'
        );
      });

      it('blocks relative path traversal (../../)', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('../../');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks absolute path traversal (/../)', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('/../');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks javascript: scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('javascript:alert("XSS")');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks web+javascript: scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert("XSS")');
        assert.deepEqual(res, null, 'result');
      });

      it('allows valid web+ custom schemes', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar');
        assert.strictEqual(res, 'web+foo:bar', 'result');
      });

      it('blocks unregistered custom schemes', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo:bar');
        assert.deepEqual(res, null, 'result');
      });

      it('allows dynamically added schemes via "only" option', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('allows schemes added to instance while restricting via "only"', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('bar');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(sanitizer.has('bar'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('allows dynamically added schemes via "allow" option', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.sanitize('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(sanitizer.has('foo'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('respects instance schemes alongside "allow" option', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('bar');
        const res = sanitizer.sanitize('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(sanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(sanitizer.has('bar'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('is case-sensitive and blocks mismatched schemes in "only"', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          only: ['Foo', 'https']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('is case-sensitive and blocks mismatched schemes in "allow"', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          allow: ['Foo']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks file: scheme if not explicitly allowed', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks file: scheme if explicitly denied, overriding allow', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar', {
          deny: ['file'],
          allow: ['file']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks blob: scheme by default', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.deepEqual(res, null, 'result');
      });

      it('blocks blob: scheme even if included in "allow" option', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['blob']
        });
        URL.revokeObjectURL(url);
        assert.deepEqual(res, null, 'result');
      });

      it('blocks blob: scheme even if included in "only" option', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          only: ['blob']
        });
        URL.revokeObjectURL(url);
        assert.deepEqual(res, null, 'result');
      });

      it('allows file: scheme when explicitly permitted', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar', {
          allow: ['file']
        });
        assert.strictEqual(res, 'file:///foo/bar', 'result');
      });

      it('allows specific web+ schemes when explicitly permitted', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          allow: ['web+foo']
        });
        assert.strictEqual(res, 'web+foo:bar', 'result');
      });

      it('blocks web+ schemes when explicitly denied', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          deny: ['web+foo']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks standard HTTP when omitted from "only" list', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('http://example.com', {
          only: ['git', 'https']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('allows standard HTTPS when included in "only" list', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', {
          only: ['git', 'https']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('allows custom schemes included in "only" list', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('blocks custom schemes omitted from "only" list', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('bar');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(sanitizer.has('bar'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('blocks specific custom schemes omitted from "only" list', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('allows valid scheme with + characters (e.g., git+https)', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('git+https://example.com', {
          only: ['git', 'https']
        });
        assert.strictEqual(res, 'git+https://example.com', 'result');
      });

      it('blocks unknown scheme combinations', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          only: ['Foo', 'git', 'https']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks data: scheme if "only" list restricts it', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data'],
          only: ['git', 'https']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('allows scheme if present in "only", overriding "deny"', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', {
          deny: ['https'],
          only: ['git', 'https']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('blocks javascript: scheme executing alert', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks vbscript: scheme executing scripts', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.deepEqual(res, null, 'result');
      });

      it('blocks web+javascript: scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks web+vbscript: scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.deepEqual(res, null, 'result');
      });

      it('preserves valid URL-encoded query parameters', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('http://example.com/?lt=5&gt=4');
        const url = new URL(res);
        assert.strictEqual(res, 'http://example.com/?lt=5&gt=4', 'result');
        assert.deepEqual(
          Array.from(url.searchParams.entries()),
          [
            ['lt', '5'],
            ['gt', '4']
          ],
          'search'
        );
      });

      it('encodes unsafe HTML characters in query parameters', () => {
        const value = encodeURIComponent('5&gt=4');
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`http://example.com/?lt=${value}`);
        const url = new URL(res);
        assert.strictEqual(
          res,
          'http://example.com/?lt=5%26amp;gt%3D4',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'http://example.com/?lt=5&amp;gt=4',
          'decode'
        );
        assert.deepEqual(
          Array.from(url.searchParams.entries()),
          [['lt', '5&amp;gt=4']],
          'search'
        );
      });

      it('strips malicious script tags from query parameters', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          "http://example.com/?<script>alert('XSS');</script>"
        );
        const url = new URL(res);
        assert.strictEqual(res, 'http://example.com/', 'result');
        assert.deepEqual(Array.from(url.searchParams.entries()), [], 'search');
      });

      it('strips malicious scripts while preserving safe query parameters', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          "http://example.com/?foo=bar&<script>alert('XSS');</script>"
        );
        const url = new URL(res);
        assert.strictEqual(res, 'http://example.com/?foo=bar', 'result');
        assert.deepEqual(
          Array.from(url.searchParams.entries()),
          [['foo', 'bar']],
          'search'
        );
      });

      it('strips inline event handlers (e.g., onmouseover)', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'http://example.com/"onmouseover="alert(1)"'
        );
        assert.strictEqual(res, 'http://example.com/', 'result');
      });

      it('blocks data: scheme by default', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks data: scheme when simultaneously allowed and denied', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data'],
          deny: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('allows and decodes text data: scheme when explicitly permitted', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,Hello,%20World!', 'result');
        assert.strictEqual(
          decodeURIComponent(res),
          'data:,Hello, World!',
          'decode'
        );
      });

      it('allows and decodes base64 plain-text data: scheme', () => {
        const data = 'Hello%2C%20World!';
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          `data:text/plain;charset=UTF-8;base64,${base64Data}`,
          {
            allow: ['data']
          }
        );
        assert.strictEqual(
          res,
          'data:text/plain;charset=UTF-8,Hello%2C%20World!',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/plain;charset=UTF-8,Hello, World!',
          'decode'
        );
      });

      it('allows and preserves base64 image data: scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          {
            allow: ['data']
          }
        );
        assert.strictEqual(
          res,
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          'decode'
        );
      });

      it('decodes and handles text/plain correctly', () => {
        const data = 'Hello%2C%20World!';
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          `data:text/plain;charset=UTF-8;base64,${base64Data}`,
          {
            allow: ['data']
          }
        );
        assert.strictEqual(
          res,
          'data:text/plain;charset=UTF-8,Hello%2C%20World!',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/plain;charset=UTF-8,Hello, World!',
          'decode'
        );
      });

      it('preserves query components inside data URLs safely', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,https://example.com/#foo?', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,https://example.com/#foo?', 'result');
      });

      it('sanitizes malicious scripts nested within data: scheme HTML hash tags', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'data:,https://example.com/#<script>alert(1);</script>',
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:,https://example.com/', 'result');
      });

      it('sanitizes malicious scripts nested within data: scheme HTML query tags', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'data:,https://example.com/?<script>alert(1);</script>',
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:,https://example.com/', 'result');
      });

      it('sanitizes malicious scripts within multiple query/hash parts of data: scheme', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          'data:,https://example.com/?<script>alert(1);</script>#<script>alert(1)</script>',
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:,https://example.com/', 'result');
      });

      it('returns null for base64 data containing XSS payloads', () => {
        const data = "<script>alert('XSS');</script><script>alert(1);</script>";
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks URL-encoded script tags inside text/html data URLs', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(
          "data:text/html,%3Cscript%3Ealert('XSS');%3C/script%3E%3Cscript%3Ealert(1);%3C/script%3E",
          {
            allow: ['data']
          }
        );
        assert.deepEqual(res, null, 'result');
      });

      it('blocks base64-encoded URL-encoded script tags', () => {
        const data =
          "%3Cscript%3Ealert('XSS');%3C/script%3E%3Cscript%3Ealert(1);%3C/script%3E";
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('removes scripts inside nested inner data URLs', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const innerUrl = `data:text/html,${encodedInnerData}`;
        const data = `<img src="${innerUrl}">`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cimg%20src=%22%22%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<img src="">',
          'decode'
        );
      });

      it('removes scripts inside base64 nested inner data URLs', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const base64InnerData = btoa(encodedInnerData);
        const innerUrl = `data:text/html;base64,${base64InnerData}`;
        const data = `<img src="${innerUrl}">`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cimg%20src=%22%22%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<img src="">',
          'decode'
        );
      });

      it('cleans multiple nested malicious inner data URLs simultaneously', () => {
        const innerData1 = '<script>alert(1)</script>';
        const innerUrl1 = `data:text/html,${innerData1}`;
        const outerData1 = `<img src="${innerUrl1}">`;
        const innerData2 = '<script>alert(2)</script>';
        const base64InnerData2 = btoa(innerData2);
        const innerUrl2 = `data:text/html;base64,${base64InnerData2}`;
        const outerData2 = `<img src="${innerUrl2}">`;
        const innerData3 = '<script>alert(3)</script>';
        const encodedInnerData3 = encodeURIComponent(innerData3);
        const innerUrl3 = `data:text/html,${encodedInnerData3}`;
        const outerData3 = `<img src="${innerUrl3}">`;
        const data = `${outerData1}${outerData2}${outerData3}`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cimg%20src=%22%22%3E%3Cimg%20src=%22%22%3E%3Cimg%20src=%22%22%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<img src=""><img src=""><img src="">',
          'decode'
        );
      });

      it('safely processes nested image/svg+xml data URLs', () => {
        const data = '<div><img src="data:image/svg+xml,<svg></svg>"></div>';
        const base64Data = btoa(data);
        const url = `data:text/html;base64,${base64Data}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cdiv%3E%3Cimg%20src=%22data:image/svg+xml,%253Csvg%253E%253C/svg%253E%22%3E%3C/div%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<div><img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E"></div>',
          'decode'
        );
      });

      it('safely strips deeply nested base64 javascript: execution', () => {
        const xss = 'javascript:alert(1)';
        const data1 = `data:base64,${btoa(encodeURIComponent(xss))}`;
        const html1 = `<img src="${data1}">`;
        const data2 = `data:text/html;base64,${btoa(encodeURIComponent(html1))}`;
        const html2 = `<img src="${data2}">`;
        const data3 = `data:text/html;base64,${btoa(encodeURIComponent(html2))}`;
        const html3 = `<img src="${data3}">`;
        const url = `data:text/html;base64,${btoa(encodeURIComponent(html3))}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cimg%20src=%22data:text/html,%253Cimg%2520src=%2522data:text/html,%25253Cimg%252520src=%252522%252522%25253E%2522%253E%22%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<img src="data:text/html,%3Cimg%20src=%22data:text/html,%253Cimg%2520src=%2522%2522%253E%22%3E">',
          'decode'
        );
      });

      it('throws an error when Data URLs are nested too deeply', () => {
        let url;
        for (let i = 0; i < 18; i++) {
          let srcUrl;
          if (url) {
            srcUrl = url;
          } else {
            srcUrl = `https://example.com/?q=${i}`;
          }
          const html = `<img src="${srcUrl}">`;
          const htmlBase64 = btoa(html);
          url = `data:text/html;base64,${htmlBase64}`;
        }
        const sanitizer = new URLSanitizer();
        assert.throws(
          () =>
            sanitizer.sanitize(url, {
              allow: ['data']
            }),
          Error,
          'Data URLs nested too deeply.'
        );
      });

      it('blocks data: schemes wrapping javascript: execution', () => {
        const url = 'data:,javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks case-manipulated javascript: inside data: schemes', () => {
        const url = 'data:,JAVASCRIPT:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks URL-encoded javascript: inside data: schemes', () => {
        const url = 'data:,javasc%72ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks zero-width characters bypassing javascript: blocks', () => {
        const url = 'data:,javasc\u0072ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks hex-escaped characters in javascript: blocks', () => {
        const url = 'data:,javasc\u{0072}ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks whitespace or line separators obfuscating javascript:', () => {
        const url = 'data:,\u2028javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks HTML-entity obfuscated javascript: execution', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks non-breaking space obfuscation before javascript:', () => {
        const url = 'data:,&#xA0javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('blocks entity obfuscation within queries of data URLs', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)?foo=bar&baz=qux';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('removes javascript: execution from within img src of data: HTML', () => {
        const url = 'data:text/html,<img src="javascript:alert(1)">';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%3Cimg%3E', 'result');
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<img>',
          'decode'
        );
      });

      it('safely strips base64-encoded javascript: inside img src', () => {
        const xss = btoa('javascript:alert(1)');
        const url = `data:text/html,<img src="data:base64,${xss}">`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cimg%20src=%22%22%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<img src="">',
          'decode'
        );
      });

      it('strips dangling quotes triggering pseudo-attributes', () => {
        const xss = '" onclick="alert(1)"';
        const url = `https://example.com/${xss}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('strips URL-encoded dangling quotes', () => {
        const xss = '" onclick="alert(1)"';
        const url = `https://example.com/${encodeURIComponent(xss)}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('strips script tags injected in query', () => {
        const xss = '<script>alert(1)</script>';
        const url = `https://example.com/?${xss}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('strips URL-encoded script tags in query', () => {
        const xss = '<script>alert(1)</script>';
        const url = `https://example.com/?${encodeURIComponent(xss)}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('allows or blocks relative URLs based on allowRelative option', () => {
        const sanitizer = new URLSanitizer();
        assert.strictEqual(
          sanitizer.sanitize('/about/us', { allowRelative: false }),
          null
        );
        assert.strictEqual(
          sanitizer.sanitize('/about/us?q=1#top', { allowRelative: true }),
          '/about/us?q=1#top'
        );
        assert.strictEqual(
          sanitizer.sanitize('javascript:alert(1)', { allowRelative: true }),
          null
        );
        assert.strictEqual(
          sanitizer.sanitize('http://[::1', { allowRelative: true }),
          null
        );
        assert.strictEqual(
          sanitizer.sanitize('http://\x00', { allowRelative: true }),
          null
        );
        assert.strictEqual(
          sanitizer.sanitize('//example.com/foo.png', { allowRelative: true }),
          null
        );
      });

      it('blocks protocol-relative URL bypassing', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('//evil.com', { allowRelative: true });
        assert.strictEqual(
          res,
          null,
          'should reject protocol-relative redirect'
        );
      });

      it('blocks backslash-obfuscated URL bypassing', () => {
        const sanitizer = new URLSanitizer();
        const resSingle = sanitizer.sanitize('\\evil.com', {
          allowRelative: true
        });
        assert.strictEqual(
          resSingle,
          null,
          'should reject single backslash bypass'
        );
        const resDouble = sanitizer.sanitize('\\\\evil.com', {
          allowRelative: true
        });
        assert.strictEqual(
          resDouble,
          null,
          'should reject double backslash bypass'
        );
      });

      it('handles scheme-prefixed URLs without slashes safely', () => {
        const sanitizer = new URLSanitizer();
        const resDefault = sanitizer.sanitize('http:example.com');
        assert.strictEqual(
          resDefault,
          'http://example.com/',
          'should normalize to absolute URL'
        );
        const resRestricted = sanitizer.sanitize('http:example.com', {
          only: ['https'],
          allowRelative: true
        });
        assert.strictEqual(
          resRestricted,
          null,
          'should reject when scheme is not allowed'
        );
      });

      it('handles URIError in decodeURIComponent gracefully', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:text/html,%', { allow: ['data'] });
        assert.strictEqual(res, 'data:text/html,%25', 'result');
      });

      it('does not log debug error when inner data is plain HTML', async () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const url = 'data:text/html,<div>No URL scheme here</div>';
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize(url, { allow: ['data'], debug: true });
          assert.strictEqual(
            res,
            'data:text/html,%3Cdiv%3ENo%20URL%20scheme%20here%3C/div%3E',
            'result'
          );
          const hasParseError = warnStub.args.some(
            args =>
              args[0] &&
              args[0].includes('Failed to parse inner data URL protocol.')
          );
          assert.strictEqual(
            hasParseError,
            false,
            'Should not log parse error for plain HTML'
          );
        } finally {
          warnStub.restore();
        }
      });

      it('skips processing when circular Data URL is detected', () => {
        const warnStub = sinon.stub(console, 'warn');
        const originalHas = Set.prototype.has;
        const hasStub = sinon
          .stub(Set.prototype, 'has')
          .callsFake(function (val) {
            if (val === 'data:text/html,loop') {
              return true;
            }
            return originalHas.call(this, val);
          });
        try {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize(
            'data:text/html,<img src="data:text/html,loop">',
            { allow: ['data'], debug: true }
          );
          assert.strictEqual(
            warnStub.called,
            true,
            'console.warn should be called'
          );
          assert.strictEqual(
            warnStub.firstCall.args[0],
            '[URLSanitizer Debug] Circular Data URL detected and skipped: data:text/html,loop',
            'should output circular warning'
          );
          assert.strictEqual(
            res,
            'data:text/html,%3Cimg%20src=%22%22%3E',
            'result'
          );
        } finally {
          hasStub.restore();
          warnStub.restore();
        }
      });

      it('returns unencoded DOM if encodeURI throws URIError', () => {
        const encodeURIStub = sinon
          .stub(globalThis, 'encodeURI')
          .throws(new URIError('URI malformed'));
        try {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('data:text/html,<div>test</div>', {
            allow: ['data']
          });
          assert.strictEqual(res, 'data:text/html,<div>test</div>', 'result');
          assert.strictEqual(
            encodeURIStub.called,
            true,
            'encodeURI should be called'
          );
        } finally {
          encodeURIStub.restore();
        }
      });

      it('catches and logs debug message when relative URL parsing fails', () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize('http://[::1', {
            allowRelative: true,
            allow: ['http'],
            debug: true
          });
          assert.deepEqual(res, null, 'result should be null');
          assert.strictEqual(
            warnStub.calledOnce,
            true,
            'console.warn should be called once'
          );
          assert.strictEqual(
            warnStub.firstCall.args[0],
            '[URLSanitizer Debug] Failed to parse relative URL.',
            'should output the correct debug message'
          );
        } finally {
          warnStub.restore();
        }
      });

      describe('fast-path processing', () => {
        it('uses fast-path for HTTP(S) URLs without restrictive rules', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('https://example.com/foo', {
            allow: ['data']
          });
          assert.strictEqual(res, 'https://example.com/foo', 'result');
        });

        it('properly escapes %26 within the fast-path', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('https://example.com/?foo=1%26bar=2', {
            allow: ['data']
          });
          assert.strictEqual(
            res,
            'https://example.com/?foo=1%26amp;bar=2',
            'result'
          );
        });

        it('bypasses fast-path if URL starts with "data:"', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('data:text/plain,test', {
            allow: ['data']
          });
          assert.strictEqual(res, 'data:text/plain,test', 'result');
        });

        it('bypasses fast-path if URL contains "data:"', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize(
            'https://example.com/?redirect=data:text/plain,test',
            { allow: ['data'] }
          );
          assert.strictEqual(
            res,
            'https://example.com/?redirect=data:text/plain,test',
            'result'
          );
        });

        it('bypasses fast-path when restrictive deny or only rules apply', () => {
          const sanitizer = new URLSanitizer();
          const resDeny = sanitizer.sanitize('https://example.com/', {
            deny: ['file']
          });
          assert.strictEqual(
            resDeny,
            'https://example.com/',
            'result with deny'
          );
          const resOnly = sanitizer.sanitize('https://example.com/', {
            only: ['https', 'data']
          });
          assert.strictEqual(
            resOnly,
            'https://example.com/',
            'result with only'
          );
        });

        it('catches and logs debug message when new URL() throws', () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            const sanitizer = new URLSanitizer();
            const res = sanitizer.sanitize('http://[::1', {
              allow: ['data'],
              debug: true
            });
            assert.deepEqual(res, null, 'result should be null');
            assert.strictEqual(
              warnStub.calledOnce,
              true,
              'console.warn should be called once'
            );
            assert.strictEqual(
              warnStub.firstCall.args[0],
              '[URLSanitizer Debug] Failed to parse URL.',
              'should output the correct debug message'
            );
          } finally {
            warnStub.restore();
          }
        });

        it('catches and ignores error if new URL() throws without debug mode', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('http://[::1', {
            allow: ['data']
          });
          assert.deepEqual(res, null, 'result should be null');
        });
      });

      describe('maxLength and reason property', () => {
        const baseString = 'a'.repeat(30);
        const testUrl = `https://example.com/${baseString}`;

        it('throws RangeError when string exceeds maxLength during sanitize', () => {
          const sanitizer = new mjs.URLSanitizer();
          assert.throws(
            () => sanitizer.sanitize(testUrl, { maxLength: 49 }),
            RangeError,
            'URL length 50 exceeds maxLength 49.'
          );
        });

        it('allows URL when length is exactly at or below maxLength', () => {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize(testUrl, { maxLength: 50 });
          assert.strictEqual(res, testUrl, 'result');
        });
      });
    });

    describe('inspect sanitized URL', () => {
      it('throws TypeError for missing arguments', () => {
        const sanitizer = new URLSanitizer();
        assert.throws(
          () => sanitizer.inspect(),
          TypeError,
          'Expected String but got Undefined.'
        );
      });

      it('returns invalid object with syntax reason for unregistered schemes', () => {
        const sanitizer = new URLSanitizer();
        const url = 'javascript:alert(1)';
        const res = sanitizer.inspect(url);
        assert.deepEqual(
          res,
          {
            input: 'javascript:alert(1)',
            valid: false,
            reason: 'Sanitization failed (blocked by allowed schemes or rules).'
          },
          'result'
        );
      });

      it('returns parsed URL object properties for valid URLs', () => {
        const sanitizer = new URLSanitizer();
        const url = 'https://www.example.com/?foo=bar#baz';
        const obj = new URL(url);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = null;
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('parses unencoded plain text data: URLs', () => {
        const sanitizer = new URLSanitizer();
        const url = 'data:,Hello,%20World!';
        const obj = new URL(url);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: '',
          data: 'Hello,%20World!',
          base64: false
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('parses base64 text/plain data: URLs', () => {
        const sanitizer = new URLSanitizer();
        const data = 'Hello,%20World!';
        const base64Data = btoa(data);
        const url = `data:text/plain;charset=UTF-8;base64,${base64Data}`;
        const obj = new URL(`data:text/plain;charset=UTF-8,${data}`);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: 'text/plain;charset=UTF-8',
          data: 'Hello,%20World!',
          base64: false
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('parses and sanitizes HTML data: URLs', () => {
        const sanitizer = new URLSanitizer();
        const data = '<div onclick="alert(1)"/></div>';
        const encodedData = encodeURI('<div></div>');
        const url = `data:text/html,${encodeURIComponent(data)}`;
        const obj = new URL(`data:text/html,${encodedData}`);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: 'text/html',
          data: encodedData,
          base64: false
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('parses and sanitizes SVG data: URLs', () => {
        const sanitizer = new URLSanitizer();
        const data = '<svg><g onload="alert(1)"/></svg>';
        const encodedData = encodeURI('<svg><g></g></svg>');
        const url = `data:image/svg+xml,${encodeURI(data)}`;
        const obj = new URL(`data:image/svg+xml,${encodedData}`);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: 'image/svg+xml',
          data: encodedData,
          base64: false
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('parses and sanitizes encoded SVG data: URLs', () => {
        const sanitizer = new URLSanitizer();
        const data = '<svg><g onload="alert(1)"/></svg>';
        const encodedData = encodeURI('<svg><g></g></svg>');
        const url = `data:image/svg+xml,${encodeURIComponent(data)}`;
        const obj = new URL(`data:image/svg+xml,${encodedData}`);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: 'image/svg+xml',
          data: encodedData,
          base64: false
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('parses and sanitizes base64 SVG data: URLs', () => {
        const sanitizer = new URLSanitizer();
        const data = '<svg><g onload="alert(1)"/></svg>';
        const encodedData = encodeURI('<svg><g></g></svg>');
        const base64Data = btoa(data);
        const url = `data:image/svg+xml;base64,${base64Data}`;
        const obj = new URL(`data:image/svg+xml,${encodedData}`);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: 'image/svg+xml',
          data: encodedData,
          base64: false
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('safely handles blob URLs during inspection', () => {
        const sanitizer = new URLSanitizer();
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const obj = new URL(url);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = null;
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('identifies base64 encoded image data: URLs accurately', () => {
        const sanitizer = new URLSanitizer();
        const url =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
        const obj = new URL(url);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = {
          mime: 'image/png',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          base64: true
        };
        const res = sanitizer.inspect(url);
        assert.deepEqual(res, items, 'result');
      });

      it('allows and inspects relative URLs when allowRelative is true', () => {
        const sanitizer = new URLSanitizer();
        const url = './foo/bar';
        const res = sanitizer.inspect(url);
        assert.strictEqual(res.valid, true, 'result should be valid');
        assert.strictEqual(res.input, url, 'input should match');
        assert.strictEqual(
          res.href,
          '/foo/bar',
          'href should match the normalized relative path'
        );
        assert.strictEqual(
          res.data,
          null,
          'data should be null for non-data URLs'
        );
        assert.strictEqual(
          res.protocol,
          undefined,
          'relative URLs should not have a protocol'
        );
      });

      it('returns invalid object with reason for unregistered schemes', () => {
        const sanitizer = new mjs.URLSanitizer();
        const res = sanitizer.inspect('foo://bar');
        assert.strictEqual(res.valid, false, 'should be invalid');
        assert.strictEqual(
          res.reason,
          'Sanitization failed (blocked by allowed schemes or rules).',
          'reason should match'
        );
      });

      it('omits reason property when URL is valid', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.inspect('https://example.com');
        assert.strictEqual(res.valid, true, 'should be valid');
        assert.strictEqual(
          'reason' in res,
          false,
          'reason property should not exist'
        );
      });

      it('returns with reason when sanitize() throws an error', () => {
        const sanitizer = new URLSanitizer();
        let url = 'data:text/html,test';
        for (let i = 0; i < 18; i++) {
          const htmlBase64 = btoa(`<img src="${url}">`);
          url = `data:text/html;base64,${htmlBase64}`;
        }
        const res = sanitizer.inspect(url);
        assert.strictEqual(res.valid, false, 'should be valid: false');
        assert.strictEqual(
          res.reason,
          'Data URLs nested too deeply.',
          'reason should contain the error message from the caught exception'
        );
      });
    });

    describe('has scheme', () => {
      it('returns false if scheme is not a string', () => {
        const sanitizer = new URLSanitizer();
        assert.strictEqual(sanitizer.has(123), false, 'number');
        assert.strictEqual(sanitizer.has(null), false, 'null');
        assert.strictEqual(sanitizer.has(undefined), false, 'undefined');
        assert.strictEqual(sanitizer.has({}), false, 'object');
      });

      it('returns true for registered default schemes', () => {
        const sanitizer = new URLSanitizer();
        assert.strictEqual(sanitizer.has('http'), true, 'http');
        assert.strictEqual(sanitizer.has('https'), true, 'https');
      });

      it('returns false for unregistered schemes', () => {
        const sanitizer = new URLSanitizer();
        assert.strictEqual(sanitizer.has('unknown-scheme'), false, 'unknown');
      });

      it('normalizes input by trimming and lowercasing', () => {
        const sanitizer = new URLSanitizer();
        assert.strictEqual(
          sanitizer.has(' HTTP '),
          true,
          'trimmed and lowercased'
        );
        assert.strictEqual(sanitizer.has('HtTpS'), true, 'mixed case');
      });
    });

    describe('add scheme', () => {
      it('throws TypeError if scheme is undefined', () => {
        const schemes = new URLSanitizer();
        assert.throws(
          () => schemes.add(),
          TypeError,
          'Expected String but got Undefined.'
        );
      });

      it('throws Error if adding javascript:', () => {
        const schemes = new URLSanitizer();
        assert.throws(
          () => schemes.add('javascript'),
          Error,
          'Invalid scheme: javascript'
        );
      });

      it('throws Error if adding vbscript:', () => {
        const schemes = new URLSanitizer();
        assert.throws(
          () => schemes.add('vbscript'),
          Error,
          'Invalid scheme: vbscript'
        );
      });

      it('throws Error if adding web+javascript:', () => {
        const schemes = new URLSanitizer();
        assert.throws(
          () => schemes.add('web+javascript'),
          Error,
          'Invalid scheme: web+javascript'
        );
      });

      it('throws Error for invalid characters (e.g., =)', () => {
        const schemes = new URLSanitizer();
        assert.throws(
          () => schemes.add('foo=bar'),
          Error,
          'Invalid scheme: foo=bar'
        );
      });

      it('throws Error for invalid characters (e.g., ~)', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add('FOO~'), Error, 'Invalid scheme: FOO~');
      });

      it('successfully adds valid standard schemes', () => {
        const schemes = new URLSanitizer();
        const res = schemes.add('foo');
        assert.strictEqual(Array.isArray(res), true, 'result');
        assert.strictEqual(res.includes('foo'), true, 'added');
      });

      it('trims and lowercases schemes before adding', () => {
        const schemes = new URLSanitizer();
        const res = schemes.add(' Foo ');
        assert.strictEqual(Array.isArray(res), true, 'result');
        assert.strictEqual(res.includes('foo'), true, 'added');
      });

      it('successfully adds custom web+ schemes', () => {
        const schemes = new URLSanitizer();
        const res = schemes.add('web+foo');
        assert.strictEqual(Array.isArray(res), true, 'result');
        assert.strictEqual(res.includes('web+foo'), true, 'added');
      });

      it('throws if scheme contains script even with prefix', () => {
        const schemes = new URLSanitizer();
        assert.throws(
          () => schemes.add('web+javascript'),
          Error,
          'Invalid scheme: web+javascript'
        );
        assert.throws(
          () => schemes.add('ext+vbscript'),
          Error,
          'Invalid scheme: ext+vbscript'
        );
      });
    });

    describe('remove scheme', () => {
      it('returns false if scheme is not a string', () => {
        const sanitizer = new URLSanitizer();
        assert.strictEqual(sanitizer.remove(123), false, 'number');
        assert.strictEqual(sanitizer.remove(null), false, 'null');
        assert.strictEqual(sanitizer.remove(undefined), false, 'undefined');
        assert.strictEqual(sanitizer.remove({}), false, 'object');
      });

      it('returns false for non-existent schemes', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.remove('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('returns true when successfully removing a scheme', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.remove('foo');
        assert.strictEqual(res, true, 'result');
        assert.strictEqual(sanitizer.has('foo'), false, 'should be removed');
      });

      it('normalizes input by trimming and lowercasing before removal', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.remove(' FOO ');
        assert.strictEqual(res, true, 'result');
        assert.strictEqual(sanitizer.has('foo'), false, 'should be removed');
      });
    });

    describe('reset sanitizer', () => {
      it('resets the registered schemes back to the default list', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.remove('http');
        sanitizer.reset();
        const res = sanitizer.get();
        assert.strictEqual(sanitizer.has('http'), true, 'scheme');
        assert.deepEqual(res, uriSchemes, 'result');
      });
    });
  });

  describe('alias', () => {
    it('exports all expected utility aliases', () => {
      assert.strictEqual(typeof mjs.sanitizeURL, 'function');
      assert.strictEqual(typeof mjs.sanitizeURLSync, 'function');
      assert.strictEqual(typeof mjs.inspectURL, 'function');
      assert.strictEqual(typeof mjs.isURI, 'function');
    });

    describe('sanitize URL', () => {
      const func = mjs.sanitizeURL;

      it('returns null for missing input', async () => {
        const res = await func();
        assert.deepEqual(res, null, 'result');
      });

      it('returns null for plain string input', async () => {
        const res = await func('foo');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks javascript: scheme execution', async () => {
        const res = await func('javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('returns sanitized HTTPS URL', async () => {
        const res = await func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('allows explicitly permitted custom schemes', async () => {
        const res = await func('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(urlSanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('rejects blob URL if blob size exceeds maxBlobSize', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          maxBlobSize: 10
        });
        URL.revokeObjectURL(url);
        assert.deepEqual(
          res,
          null,
          'result should be null due to exceeding maxBlobSize'
        );
      });

      it('falls back to default MAX_BLOB_SIZE if maxBlobSize is invalid', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          maxBlobSize: -1
        });
        URL.revokeObjectURL(url);
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
      });

      it('allows blob URL if blob size is exactly at or below maxBlobSize', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          maxBlobSize: 100
        });
        URL.revokeObjectURL(url);
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
      });

      it('blocks blob: scheme and does NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url);
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks blob: scheme if denied, and does NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          deny: ['blob']
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        URL.revokeObjectURL(url);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks blob: scheme if not in only list, and does NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          only: ['https']
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('allows blob: scheme, converts to data URL, and does NOT revoke by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob']
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        URL.revokeObjectURL(url);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:image/svg+xml,<svg><g></g></svg>',
          'decoded'
        );
      });

      it('returns null if blob: URL was manually revoked beforehand', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        URL.revokeObjectURL(url);
        const res = await func(url, {
          allow: ['blob']
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        URL.revokeObjectURL(url);
        assert.strictEqual(isRevoked, true, 'revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('processes blob: without revoking, safely handling data conflicts', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          deny: ['data']
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        URL.revokeObjectURL(url);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:image/svg+xml,<svg><g></g></svg>',
          'decoded'
        );
      });

      it('processes blob: with "only" rules without revoking', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          only: ['blob', 'https']
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        URL.revokeObjectURL(url);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.strictEqual(
          decodeURIComponent(res),
          'data:image/svg+xml,<svg><g></g></svg>',
          'decoded'
        );
      });

      it('revokes blob: URL automatically if revokeObjectURL is true', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          revokeObjectURL: true
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        assert.strictEqual(isRevoked, true, 'should be revoked');
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
      });

      it('blocks blob: and revokes URL automatically if revokeObjectURL is true', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          revokeObjectURL: true
        });
        const isRevoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        assert.strictEqual(isRevoked, true, 'should be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('sanitizes and strips trailing quotes from URLs', async () => {
        const url = 'https://example.com/"quoted"';
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('sanitizes and strips trailing single-quotes from URLs', async () => {
        const url = "https://example.com/'quoted'";
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('sanitizes and strips trailing quotes from query parameters', async () => {
        const url = 'https://example.com/?q="quoted"';
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/?q=', 'result');
      });

      it('sanitizes and strips trailing single-quotes from query parameters', async () => {
        const url = "https://example.com/?q='quoted'";
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/?q=', 'result');
      });

      it('merges schemes safely into options.only without mutating original array', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = { only: ['blob', 'https'] };
        const res = await func(url, opt);
        URL.revokeObjectURL(url);
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.deepEqual(
          opt.only,
          ['blob', 'https'],
          'original only array should not be mutated'
        );
      });

      it('preserves options.only if required schemes are already present', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = { only: ['blob', 'data', 'https'] };
        const res = await func(url, opt);
        URL.revokeObjectURL(url);
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.deepEqual(
          opt.only,
          ['blob', 'data', 'https'],
          'original only array should not be mutated'
        );
      });

      it('merges schemes safely into options.allow and removes from options.deny', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = {
          allow: ['blob', 'http'],
          deny: ['data', 'ftp']
        };
        const res = await func(url, opt);
        URL.revokeObjectURL(url);
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.deepEqual(
          opt.allow,
          ['blob', 'http'],
          'original allow array should not be mutated'
        );
        assert.deepEqual(
          opt.deny,
          ['data', 'ftp'],
          'original deny array should not be mutated'
        );
      });

      it('preserves options.allow if required schemes are already present', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = { allow: ['blob', 'data'] };
        const res = await func(url, opt);
        URL.revokeObjectURL(url);
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
        assert.deepEqual(
          opt.allow,
          ['blob', 'data'],
          'original allow array should not be mutated'
        );
      });

      it('returns null for malformed base64 strings', () => {
        const sanitizer = new mjs.URLSanitizer();
        const res1 = sanitizer.sanitize(
          'data:text/html;base64,invalid!base64',
          {
            allow: ['data']
          }
        );
        assert.deepEqual(
          res1,
          null,
          'result should be null for failing REG_B64'
        );
        const res2 = sanitizer.sanitize('data:text/html;base64,a-b_', {
          allow: ['data']
        });
        assert.deepEqual(res2, null, 'result should be null for failing atob');
      });

      describe('DOMPurify hook edge cases', () => {
        it('returns early if active context is missing', async () => {
          const { domPurify } = await import('../src/mjs/dompurify.js');
          assert.doesNotThrow(() => {
            domPurify.sanitize('<a href="data:text/html,test">link</a>');
          }, 'Should not throw when active context is missing');
        });

        it('returns early in hook if attrValue is empty', () => {
          const sanitizer = new mjs.URLSanitizer();
          const html = '<img src=""><input disabled>';
          const base64Data = btoa(html);
          const url = `data:text/html;base64,${base64Data}`;
          const res = sanitizer.sanitize(url, { allow: ['data'] });
          assert.strictEqual(typeof res, 'string', 'result should be a string');
          assert.strictEqual(
            decodeURIComponent(res).includes('<img src="">'),
            true,
            'empty attribute should be safely processed'
          );
        });

        it('returns early in hook if URL.parse returns null', () => {
          const parseStub = sinon.stub(URL, 'parse').callsFake((url, base) => {
            if (url === 'data:text/html,error-trigger') {
              return null;
            }
            return parseStub.wrappedMethod(url, base);
          });
          try {
            const sanitizer = new mjs.URLSanitizer();
            const html = '<a href="data:text/html,error-trigger">link</a>';
            const base64Data = btoa(html);
            const url = `data:text/html;base64,${base64Data}`;
            const res = sanitizer.sanitize(url, { allow: ['data'] });
            assert.strictEqual(
              parseStub.calledWith('data:text/html,error-trigger'),
              true,
              'URL.parse should be called with the target URL'
            );
            assert.strictEqual(
              typeof res,
              'string',
              'result should be a string'
            );
          } finally {
            parseStub.restore();
          }
        });
      });

      describe('Unicode / CJK characters', () => {
        const encodeBase64UTF8 = str =>
          btoa(String.fromCharCode(...new TextEncoder().encode(str)));

        it('safely handles CJK characters in standard URL', () => {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize(
            'https://example.com/テスト?検索=テスト#ハッシュ'
          );
          assert.strictEqual(
            res,
            'https://example.com/%E3%83%86%E3%82%B9%E3%83%88?%E6%A4%9C%E7%B4%A2=%E3%83%86%E3%82%B9%E3%83%88#%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5',
            'result'
          );
        });

        it('strips XSS mixed with CJK characters in standard URL', () => {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize(
            'https://example.com/テスト?<script>alert("攻撃")</script>'
          );
          assert.strictEqual(
            res,
            'https://example.com/%E3%83%86%E3%82%B9%E3%83%88',
            'result'
          );
        });

        it('safely handles CJK characters in plain data URL', () => {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize(
            'data:text/html,<div>こんにちは世界</div>',
            {
              allow: ['data']
            }
          );
          assert.strictEqual(
            res,
            'data:text/html,%3Cdiv%3E%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%E4%B8%96%E7%95%8C%3C/div%3E',
            'result'
          );
          assert.strictEqual(
            decodeURIComponent(res),
            'data:text/html,<div>こんにちは世界</div>',
            'decode'
          );
        });

        it('safely handles CJK characters in base64 data URL', () => {
          const sanitizer = new mjs.URLSanitizer();
          const base64Data = encodeBase64UTF8('<div>こんにちは世界</div>');
          const res = sanitizer.sanitize(
            `data:text/html;base64,${base64Data}`,
            {
              allow: ['data']
            }
          );
          assert.strictEqual(
            res,
            'data:text/html,%3Cdiv%3E%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%E4%B8%96%E7%95%8C%3C/div%3E',
            'result'
          );
          assert.strictEqual(
            decodeURIComponent(res),
            'data:text/html,<div>こんにちは世界</div>',
            'decode'
          );
        });

        it('strips XSS mixed with CJK in base64 data URL', () => {
          const sanitizer = new mjs.URLSanitizer();
          const base64Data = encodeBase64UTF8(
            '<div>安全<script>alert("危険")</script></div>'
          );
          const res = sanitizer.sanitize(
            `data:text/html;base64,${base64Data}`,
            {
              allow: ['data']
            }
          );
          assert.strictEqual(
            res,
            'data:text/html,%3Cdiv%3E%E5%AE%89%E5%85%A8%3C/div%3E',
            'result'
          );
          assert.strictEqual(
            decodeURIComponent(res),
            'data:text/html,<div>安全</div>',
            'decode'
          );
        });
      });

      describe('Zero Width Characters', () => {
        const func = mjs.sanitizeURL;

        it('blocks scheme obfuscation via zero-width characters', async () => {
          const res = await func('jav\u200Bascript:alert(1)');
          assert.deepEqual(res, null, 'result');
        });

        it('blocks URL-encoded zero-width characters in schemes', async () => {
          const res = await func('jav%E2%80%8Bascript:alert(1)');
          assert.deepEqual(res, null, 'result');
        });

        it('allows zero-width characters in paths or query strings', async () => {
          const res = await func(
            'https://example.com/path\u200Bname?q=val\u200Bue'
          );
          assert.strictEqual(
            res,
            'https://example.com/path%E2%80%8Bname?q=val%E2%80%8Bue',
            'result'
          );
        });

        it('preserves zero-width characters in safe data URL payloads', async () => {
          const res = await func('data:text/html,<div>Hello\u200BWorld</div>', {
            allow: ['data']
          });
          assert.strictEqual(
            res,
            'data:text/html,%3Cdiv%3EHello%E2%80%8BWorld%3C/div%3E',
            'result'
          );
        });

        it('safely handling zero-width characters in MIME types neutralizing execution', async () => {
          const res = await func(
            'data:text/h\u200Btml,<script>alert(1)</script>',
            {
              allow: ['data']
            }
          );
          assert.strictEqual(
            res,
            'data:text/h%E2%80%8Btml,<script>alert(1)</script>',
            'result'
          );
        });

        it('returns null when zero-width characters are injected into base64 payloads', async () => {
          const base64Data = btoa('<div>test</div>'); // "PGRpdj50ZXN0PC9kaXY+"
          const obfuscatedBase64 =
            base64Data.slice(0, 5) + '\u200B' + base64Data.slice(5);
          const res = await func(`data:text/html;base64,${obfuscatedBase64}`, {
            allow: ['data']
          });
          assert.deepEqual(res, null, 'result');
        });

        it('truncates standard URLs if zero-width obfuscated tags are detected', async () => {
          const res = await func(
            'https://example.com/?q=<scr\u200Bipt>alert(1)</scr\u200Bipt>'
          );
          assert.strictEqual(res, 'https://example.com/?q=', 'result');
        });

        it('safely processes zero-width characters in domain names', async () => {
          const res = await func('https://exam\u200Bple.com/');
          assert.ok(res !== null, 'should not be null');
          assert.strictEqual(res, 'https://example.com/', 'result');
        });
      });

      describe('Inner protocol fail secure', () => {
        it('returns null securely when nested entities crash the parser', () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            let nestedAmps = '&';
            for (let i = 0; i < 20; i++) {
              nestedAmps = nestedAmps.replace(/&/g, '&amp;');
            }
            const payload = `&#${nestedAmps}avascript:alert(1)`;
            const sanitizer = new mjs.URLSanitizer();
            const res = sanitizer.sanitize(`data:text/html,${payload}`, {
              allow: ['data'],
              debug: true
            });
            assert.strictEqual(
              res,
              null,
              'should fail securely and return null'
            );
            assert.strictEqual(
              warnStub.called,
              true,
              'console.warn should be called in debug mode'
            );
            assert.strictEqual(
              warnStub.firstCall.args[0],
              '[URLSanitizer Debug] Failed to parse inner data URL protocol.',
              'should log the specific inner parsing failure message'
            );
            assert.strictEqual(
              warnStub.firstCall.args[1] instanceof Error,
              true,
              'should include the original error'
            );
            assert.strictEqual(
              warnStub.firstCall.args[1].message,
              'Character references nested too deeply.',
              'should included the original error message'
            );
          } finally {
            warnStub.restore();
          }
        });

        it('returns null securely when inner URL parsing returns null', () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            const sanitizer = new mjs.URLSanitizer();
            const res = sanitizer.sanitize('data:text/html,http://[::1', {
              allow: ['data'],
              debug: true
            });
            assert.strictEqual(
              res,
              null,
              'should fail securely and return null'
            );
            assert.strictEqual(
              warnStub.called,
              true,
              'console.warn should be called'
            );
            assert.strictEqual(
              warnStub.firstCall.args[0],
              '[URLSanitizer Debug] Failed to parse inner data URL protocol.',
              'should log the inner parsing failure message'
            );
          } finally {
            warnStub.restore();
          }
        });
      });
    });

    describe('sanitize URL sync', () => {
      const func = mjs.sanitizeURLSync;

      it('returns null for missing input', () => {
        const res = func();
        assert.deepEqual(res, null, 'result');
      });

      it('returns null for plain string input', () => {
        const res = func('foo');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks javascript: scheme execution', () => {
        const res = func('javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('returns sanitized HTTPS URL', () => {
        const res = func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('allows explicitly permitted custom schemes', () => {
        const res = func('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(urlSanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('blocks blob: scheme and does NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = func(url, {
          allow: ['blob']
        });
        const revoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        URL.revokeObjectURL(url);
        assert.strictEqual(revoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('blocks blob: scheme and revokes blob if explicitly enabled', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = func(url, {
          allow: ['blob'],
          revokeObjectURL: true
        });
        const revoked = await fetch(url)
          .then(() => false)
          .catch(() => true);
        assert.strictEqual(revoked, true, 'revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('logs debug message for invalid URL format when debug is true', () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const invalidUrl = 'invalid-url-string';
          const res = func(invalidUrl, { debug: true });
          assert.deepEqual(res, null, 'result should be null');
          assert.strictEqual(
            warnStub.calledOnce,
            true,
            'console.warn should be called once'
          );
          const expectedPrefix = `[URLSanitizer Debug] Invalid URL input format: ${invalidUrl}`;
          assert.strictEqual(
            warnStub.firstCall.args[0],
            expectedPrefix,
            'should output the correct debug message'
          );
        } finally {
          warnStub.restore();
        }
      });

      it('does NOT log debug message for invalid URL format when debug is false', () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const invalidUrl = 'invalid-url-string';
          const res = func(invalidUrl, { debug: false });
          assert.deepEqual(res, null, 'result should be null');
          assert.strictEqual(
            warnStub.called,
            false,
            'console.warn should not be called'
          );
        } finally {
          warnStub.restore();
        }
      });
    });

    describe('inspect URL', () => {
      const func = mjs.inspectURL;

      it('returns inspected URL object correctly', () => {
        const url = 'https://example.com';
        const obj = new URL(url);
        const items = {};
        for (const key in obj) {
          const value = obj[key];
          if (isString(value)) {
            items[key] = value;
          }
        }
        items.input = url;
        items.valid = true;
        items.data = null;
        const res = func(url);
        assert.deepEqual(res, items, 'result');
      });
    });

    describe('is URI', () => {
      const func = mjs.isURI;

      it('identifies valid and registered scheme securely', async () => {
        const res = func('https://example.com');
        assert.strictEqual(res, true, 'result');
      });
    });
  });
});
