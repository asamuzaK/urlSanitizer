/**
 * filter.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

/* test */
import * as mjs from '../src/mjs/filter.js';

describe('filter', () => {
  describe('Sanitize context', () => {
    const { SanitizeContext } = mjs;

    it('initializes properties correctly with default options', () => {
      const mockDomPurify = {};
      const ctx = new SanitizeContext(undefined, mockDomPurify);
      assert.strictEqual(ctx.debug, false, 'debug should be false by default');
      assert.deepEqual(
        ctx.schemes,
        new Set(),
        'schemes should be an empty Set by default'
      );
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

    it('initializes scheme property correctly when opt.schemes is given', () => {
      const ctx = new SanitizeContext(
        { schemes: new Set(['http', 'https']) },
        {}
      );
      assert.deepEqual(
        ctx.schemes,
        new Set(['http', 'https']),
        'schemes should match Set'
      );
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

  describe('Sanitize filter', () => {
    const { SanitizeFilter } = mjs;
    let filter;

    beforeEach(() => {
      filter = new SanitizeFilter();
    });

    describe('sanitize() URL', () => {
      it('returns null for empty input', () => {
        assert.deepEqual(filter.sanitize(), null, 'result');
      });

      it('returns null for plain strings without a scheme', () => {
        assert.deepEqual(filter.sanitize('foo'), null, 'result');
      });

      it('returns sanitized valid HTTPS URLs', () => {
        assert.strictEqual(
          filter.sanitize('https://example.com'),
          'https://example.com/',
          'result'
        );
      });

      it('blocks javascript: scheme executing alert', () => {
        assert.deepEqual(
          filter.sanitize('javascript:alert(1)'),
          null,
          'result'
        );
      });

      it('allows non-registered schemes via "allow" option', () => {
        const res = filter.sanitize('foo:bar', new Set(), { allow: ['foo'] });
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('blocks custom schemes when explicitly denied', () => {
        const res = filter.sanitize('web+foo:bar', new Set(), {
          deny: ['web+foo']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('strips malicious script tags from query parameters', () => {
        const res = filter.sanitize(
          "http://example.com/?<script>alert('XSS');</script>",
          new Set(['http', 'https'])
        );
        assert.strictEqual(res, 'http://example.com/', 'result');
      });

      it('blocks relative URLs by default', () => {
        assert.deepEqual(filter.sanitize('/about/us'), null, 'result');
      });

      it('allows relative URLs when allowRelative is true', () => {
        const res = filter.sanitize('/about/us?q=1#top', new Set(), {
          allowRelative: true
        });
        assert.strictEqual(res, '/about/us?q=1#top', 'result');
      });

      it('throws RangeError when URL length exceeds max length', () => {
        const testUrl = 'https://example.com/' + 'a'.repeat(30);
        assert.throws(
          () => filter.sanitize(testUrl, new Set(), { maxLength: 49 }),
          RangeError,
          'URL length 50 exceeds max length 49.'
        );
      });

      it('returns null if URL parsing fails in the fast-path', () => {
        const res = filter.sanitize('http://[::1', new Set(), {});
        assert.deepEqual(
          res,
          null,
          'result should be null for malformed URL in fast-path'
        );
      });

      describe('max nest restriction)', () => {
        it('throws an error when Data URLs are nested too deeply', () => {
          let url;
          for (let i = 0; i < 18; i++) {
            const srcUrl = url || `https://example.com/?q=${i}`;
            const html = `<img src="${srcUrl}">`;
            const htmlBase64 = btoa(html);
            url = `data:text/html;base64,${htmlBase64}`;
          }
          assert.throws(
            () => filter.sanitize(url, new Set(), { allow: ['data'] }),
            Error,
            'Data URLs nested too deeply.'
          );
        });
      });

      describe('script or blob rejection', () => {
        it('rejects "javascript" from being registered via "allow" option', () => {
          const res = filter.sanitize('javascript:alert(1)', new Set(), {
            allow: ['javascript']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null because javascript cannot be allowed'
          );
        });

        it('rejects "vbscript" from being registered via "allow" option', () => {
          const res = filter.sanitize('vbscript:msgbox(1)', new Set(), {
            allow: ['vbscript']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null because vbscript cannot be allowed'
          );
        });

        it('rejects "blob" from being registered via "only" option', () => {
          const res = filter.sanitize(
            'blob:https://example.com/uuid',
            new Set(),
            {
              only: ['blob']
            }
          );
          assert.deepEqual(
            res,
            null,
            'result should be null because blob cannot be restricted/allowed'
          );
        });
      });

      describe('allow scheme logic', () => {
        it('returns sanitized URL if the scheme exactly matches the only option', () => {
          const res = filter.sanitize('https://example.com', new Set(), {
            only: ['https']
          });
          assert.strictEqual(res, 'https://example.com/', 'result');
        });

        it('returns null if the scheme is omitted from the only option', () => {
          const res = filter.sanitize('http://example.com', new Set(), {
            only: ['https']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null for omitted scheme'
          );
        });

        it('allows custom schemes if explicitly included in the only option', () => {
          const res = filter.sanitize('web+custom:test', new Set(), {
            only: ['web+custom']
          });
          assert.strictEqual(res, 'web+custom:test', 'result');
        });

        it('blocks custom schemes if absent from the only option', () => {
          const res = filter.sanitize('web+custom:test', new Set(), {
            only: ['https']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null for unlisted custom scheme'
          );
        });

        it('blocks data URL if data is omitted from the only option', () => {
          const res = filter.sanitize('data:text/plain,hello', new Set(), {
            only: ['https']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null since data is not in only list'
          );
        });

        it('returns null if the scheme is simultaneously allowed and denied', () => {
          const res = filter.sanitize('https://example.com', new Set(), {
            allow: ['https'],
            deny: ['https']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null for explicitly denied scheme'
          );
        });

        it('returns null if an allowed compound scheme contains an explicitly denied part', () => {
          const res = filter.sanitize('git+https://example.com', new Set(), {
            allow: ['git+https'],
            deny: ['git']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null if any part of the scheme is denied'
          );
        });

        it('returns null if an allowed compound scheme contains a default denied part like "data"', () => {
          const res = filter.sanitize('web+data:test', new Set(), {
            allow: ['web+data']
          });
          assert.deepEqual(
            res,
            null,
            'result should be null if compound scheme contains default denied part'
          );
        });
      });

      describe('fallback mechanisms', () => {
        it('falls through and uses original DOM string if decodeURIComponent throws', () => {
          const url = 'data:text/html,<div>%</div>';
          const res = filter.sanitize(url, new Set(), { allow: ['data'] });
          assert.strictEqual(
            res,
            'data:text/html,%3Cdiv%3E%25%3C/div%3E',
            'should handle decodeURIComponent URIError gracefully (fall through)'
          );
        });

        it('returns unencoded DOM if encodeURI throws URIError', () => {
          const encodeURIStub = sinon
            .stub(globalThis, 'encodeURI')
            .throws(new URIError('URI malformed'));
          try {
            const url = 'data:text/html,<div>test</div>';
            const res = filter.sanitize(url, new Set(), { allow: ['data'] });
            assert.strictEqual(
              res,
              'data:text/html,<div>test</div>',
              'should return unencoded string if encodeURI fails'
            );
            assert.strictEqual(
              encodeURIStub.called,
              true,
              'encodeURI should have been called'
            );
          } finally {
            encodeURIStub.restore();
          }
        });
      });
    });

    describe('DOMPurify hook', () => {
      it('returns early if attrValue is empty or not a data URL', () => {
        const html = '<img src=""><a href="https://example.com">link</a>';
        const url = `data:text/html,${html}`;
        const res = filter.sanitize(url, new Set(), { allow: ['data'] });
        assert.ok(
          res.includes('%3Cimg%20src=%22%22%3E'),
          'empty attribute should be safely processed and preserved'
        );
        assert.ok(
          res.includes('href=%22https://example.com%22'),
          'non-data URL should be preserved'
        );
      });

      it('returns early if URL.parse returns null for the attribute', () => {
        const parseStub = sinon.stub(URL, 'parse').callsFake((urlStr, base) => {
          if (urlStr === 'data:text/html,error-trigger') {
            return null;
          }
          return parseStub.wrappedMethod(urlStr, base);
        });
        try {
          const html = '<a href="data:text/html,error-trigger">link</a>';
          const url = `data:text/html,${html}`;
          const res = filter.sanitize(url, new Set(), { allow: ['data'] });
          assert.strictEqual(
            parseStub.calledWith('data:text/html,error-trigger'),
            true,
            'URL.parse should be called with the target attribute URL'
          );
          assert.strictEqual(
            typeof res,
            'string',
            'result should be a string even if inner parse fails'
          );
        } finally {
          parseStub.restore();
        }
      });

      it('sets attrValue to empty string if circular reference is detected', () => {
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
          const res = filter.sanitize(
            'data:text/html,<img src="data:text/html,loop">',
            new Set(),
            { allow: ['data'], debug: true }
          );
          assert.strictEqual(
            res,
            'data:text/html,%3Cimg%20src=%22%22%3E',
            'circular reference attribute should be replaced with empty string'
          );
        } finally {
          hasStub.restore();
          warnStub.restore();
        }
      });

      it('sets attrValue to empty string if inner sanitization fails or returns null', () => {
        const innerUrl = 'data:text/html,<script>alert(1)</script>';
        const url = `data:text/html,<img src="${innerUrl}">`;
        const res = filter.sanitize(url, new Set(), { allow: ['data'] });
        assert.strictEqual(
          res,
          'data:text/html,%3Cimg%20src=%22%22%3E',
          'malicious inner data URL should be stripped and set to empty string'
        );
      });

      it('returns null when DOMPurify strips all content (e.g., iframe)', () => {
        const url =
          'data:text/html,<iframe src="data:text/html,test"></iframe>';
        const res = filter.sanitize(url, new Set(), { allow: ['data'] });
        assert.deepEqual(
          res,
          null,
          'should return null because the iframe is completely stripped by DOMPurify'
        );
      });
    });

    describe('sanitizeBuffer()', () => {
      it('returns null if the first argument is not an ArrayBuffer', async () => {
        const invalidBuffers = [
          undefined,
          null,
          'string_data',
          12345,
          {},
          new Blob(['test'])
        ];
        for (const value of invalidBuffers) {
          const res = await filter.sanitizeBuffer(
            value,
            'text/plain',
            new Set(),
            {
              allow: ['data']
            }
          );
          assert.strictEqual(
            res,
            null,
            `result should be null when buffer is ${typeof value}`
          );
        }
      });

      it('returns null if the "data" scheme is not explicitly allowed', async () => {
        const buffer = new ArrayBuffer(8);
        const res = await filter.sanitizeBuffer(buffer, 'image/png');
        assert.strictEqual(
          res,
          null,
          'result should be null when data is not allowed'
        );
      });

      it('successfully encodes valid buffer to data URL', async () => {
        // "hello" as Uint8Array
        const buffer = new Uint8Array([104, 101, 108, 108, 111]).buffer;
        const res = await filter.sanitizeBuffer(
          buffer,
          'text/plain',
          new Set(),
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:text/plain,hello', 'result');
      });

      it('successfully encodes valid buffer to data URL regardless of mime type', async () => {
        // "hello" as Uint8Array
        const buffer = new Uint8Array([104, 101, 108, 108, 111]).buffer;
        const res = await filter.sanitizeBuffer(
          buffer,
          'image/png',
          new Set(),
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:image/png,hello', 'result');
      });

      it('preserves base64 encoding for real binary data', async () => {
        const buffer = new Uint8Array([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
        ]).buffer;
        const res = await filter.sanitizeBuffer(
          buffer,
          'image/png',
          new Set(),
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:image/png;base64,iVBORw0KGgo=', 'result');
      });

      it('returns null if the Data URL fails to parse', async () => {
        const buffer = new ArrayBuffer(8);
        const parseStub = sinon.stub(URL, 'parse').returns(null);
        try {
          const res = await filter.sanitizeBuffer(
            buffer,
            'image/png',
            new Set(),
            {
              allow: ['data']
            }
          );
          assert.strictEqual(
            res,
            null,
            'result should be null when URL.parse() returns null'
          );
          assert.strictEqual(
            parseStub.called,
            true,
            'URL.parse should have been called'
          );
        } finally {
          parseStub.restore();
        }
      });

      describe('Data URL construction based on mimeType', () => {
        it('constructs Data URL with mimeType when mimeType is provided', async () => {
          const base64Png =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          const buffer = Uint8Array.from(atob(base64Png), c =>
            c.charCodeAt(0)
          ).buffer;
          const res = await filter.sanitizeBuffer(
            buffer,
            'image/png',
            new Set(),
            {
              allow: ['data']
            }
          );
          assert.ok(
            typeof res === 'string' && res.startsWith('data:image/png;base64,'),
            'result should be a data URL starting with "data:image/png;base64,"'
          );
        });

        it('constructs Data URL without mimeType when mimeType is empty or null', async () => {
          const encoder = new TextEncoder();
          const buffer = encoder.encode('Hello World').buffer;
          const res = await filter.sanitizeBuffer(buffer, '', new Set(), {
            allow: ['data']
          });
          assert.strictEqual(
            res,
            'data:,Hello World',
            'result should be a normalized plain data URL without mimeType'
          );
        });
      });
    });

    describe('sanitizeDataURL()', () => {
      it('returns null for missing or empty input', async () => {
        assert.deepEqual(await filter.sanitizeDataURL(), null, 'missing input');
        assert.deepEqual(await filter.sanitizeDataURL(''), null, 'empty input');
      });

      it('returns null if the scheme is not "data"', async () => {
        const res = await filter.sanitizeDataURL(
          'https://example.com/',
          new Set(),
          {
            allow: ['data']
          }
        );
        assert.deepEqual(res, null, 'result');
      });

      it('returns null if the data scheme is not explicitly allowed', async () => {
        const res = await filter.sanitizeDataURL('data:text/plain,hello');
        assert.deepEqual(res, null, 'result');
      });

      it('returns a sanitized string when the data scheme is explicitly allowed', async () => {
        const res = await filter.sanitizeDataURL(
          'data:text/plain,hello',
          new Set(),
          {
            allow: ['data']
          }
        );
        assert.strictEqual(res, 'data:text/plain,hello', 'result');
      });

      it('strips malicious scripts from HTML data URLs', async () => {
        const url =
          'data:text/html,<script>alert("XSS")</script><div>Hello</div>';
        const res = await filter.sanitizeDataURL(url, new Set(), {
          allow: ['data']
        });
        assert.strictEqual(
          res,
          'data:text/html,%3Cdiv%3EHello%3C/div%3E',
          'result'
        );
      });

      it('returns null for unparseable or invalid base64 data URLs', async () => {
        const res = await filter.sanitizeDataURL(
          'data:text/html;base64,invalid!base64',
          new Set(),
          {
            allow: ['data']
          }
        );
        assert.deepEqual(res, null, 'result');
      });

      it('throws RangeError when URL length exceeds max length', async () => {
        const url = 'data:text/plain,hello'; // 21
        let caughtError = null;
        try {
          await filter.sanitizeDataURL(url, new Set(), { maxLength: 10 });
        } catch (e) {
          caughtError = e;
        }
        assert.ok(caughtError instanceof RangeError, 'should throw RangeError');
        assert.strictEqual(
          caughtError.message,
          'URL length 21 exceeds max length 10.',
          'error message'
        );
      });

      it('returns null if URL parsing fails', async () => {
        const res = await filter.sanitizeDataURL('http://[::1', new Set(), {
          allow: ['data']
        });
        assert.deepEqual(
          res,
          null,
          'should return null for malformed URL string'
        );
      });

      it('returns null when inner URL parsing returns null', async () => {
        const res = await filter.sanitizeDataURL(
          'data:text/html,http://[::1',
          new Set(),
          { allow: ['data'] }
        );

        assert.deepEqual(
          res,
          null,
          'should return null when inner URL parsing fails'
        );
      });

      describe('inner URL scheme validation', () => {
        it('returns null if inner URL scheme contains script (e.g. javascript:)', async () => {
          const res = await filter.sanitizeDataURL(
            'data:text/html,javascript:alert(1)',
            new Set(),
            { allow: ['data'] }
          );
          assert.deepEqual(
            res,
            null,
            'should return null when inner scheme is javascript'
          );
        });

        it('returns null if inner URL scheme contains blob (e.g. blob:)', async () => {
          const res = await filter.sanitizeDataURL(
            'data:text/html,blob:https://example.com/uuid',
            new Set(),
            { allow: ['data'] }
          );
          assert.deepEqual(
            res,
            null,
            'should return null when inner scheme is blob'
          );
        });
      });

      describe('base64 parsing error handling', () => {
        it('logs debug message when base64 parsing fails and debug is true', async () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            const res = await filter.sanitizeDataURL(
              'data:text/html;base64,invalid!base64',
              new Set(),
              { allow: ['data'], debug: true }
            );
            assert.deepEqual(
              res,
              null,
              'result should be null for invalid base64'
            );
            assert.strictEqual(
              warnStub.called,
              true,
              'console.warn should be called'
            );
            assert.ok(
              warnStub.firstCall.args[0].includes(
                'Failed to parse base64 data.'
              ),
              'should log the correct error message'
            );
          } finally {
            warnStub.restore();
          }
        });

        it('does not log debug message when base64 parsing fails and debug is false', async () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            const res = await filter.sanitizeDataURL(
              'data:text/html;base64,invalid!base64',
              new Set(),
              { allow: ['data'], debug: false }
            );
            assert.deepEqual(
              res,
              null,
              'result should be null for invalid base64'
            );
            assert.strictEqual(
              warnStub.called,
              false,
              'console.warn should not be called'
            );
          } finally {
            warnStub.restore();
          }
        });

        it('logs debug message when inner protocol parsing fails and debug is true', async () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            let nestedAmps = '&';
            for (let i = 0; i < 20; i++) {
              nestedAmps = nestedAmps.replace(/&/g, '&amp;');
            }
            const payload = `&#${nestedAmps}avascript:alert(1)`;
            const url = `data:text/html,${payload}`;
            const res = await filter.sanitizeDataURL(url, new Set(), {
              allow: ['data'],
              debug: true
            });
            assert.deepEqual(res, null, 'should fail securely and return null');
            assert.strictEqual(
              warnStub.called,
              true,
              'console.warn should be called'
            );
            assert.ok(
              warnStub.firstCall.args[0].includes(
                'Failed to parse inner data URL protocol.'
              ),
              'should log the correct debug message'
            );
            assert.ok(
              warnStub.firstCall.args[1] instanceof Error,
              'should include the original error object'
            );
          } finally {
            warnStub.restore();
          }
        });

        it('does not log debug message when inner protocol parsing fails and debug is false', async () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            let nestedAmps = '&';
            for (let i = 0; i < 20; i++) {
              nestedAmps = nestedAmps.replace(/&/g, '&amp;');
            }
            const payload = `&#${nestedAmps}avascript:alert(1)`;
            const url = `data:text/html,${payload}`;
            const res = await filter.sanitizeDataURL(url, new Set(), {
              allow: ['data'],
              debug: false
            });
            assert.deepEqual(res, null, 'should fail securely and return null');
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
    });
  });
});
