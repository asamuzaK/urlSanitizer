/**
 * filter.test.js
 */
/* eslint-disable no-await-in-loop */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with { type: 'json' };
import { MAX_BLOB_SIZE, MAX_URL_LENGTH } from '../src/mjs/constant.js';
import * as mjs from '../src/mjs/filter.js';

const DEFAULT_OPTS = Object.freeze({
  allow: Object.freeze([]),
  deny: Object.freeze([]),
  only: null,
  allowRelative: false,
  debug: false,
  revokeObjectURL: false,
  maxBlobSize: MAX_BLOB_SIZE,
  maxLength: MAX_URL_LENGTH,
  schemes: new Set(uriSchemes)
});

describe('filter', () => {
  describe('Sanitize context', () => {
    const { SanitizeContext } = mjs;

    it('initializes properties correctly with default options', () => {
      const mockDomPurify = {};
      const ctx = new SanitizeContext(mockDomPurify);
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
      const ctx = new SanitizeContext({}, { debug: true });
      assert.strictEqual(ctx.debug, true, 'debug should be true');
    });

    describe('register compound schemes', () => {
      it('rejects schemes containing script parts separated by "+" (e.g., "http+javascript")', () => {
        const ctx = new SanitizeContext({}, { allow: ['http+javascript'] });
        assert.strictEqual(ctx.schemeMap.get('http+javascript'), undefined);
      });

      it('allows schemes containing non-script parts separated by "+" (e.g., "foo+script", "foo+bar")', () => {
        const ctx = new SanitizeContext(
          {},
          { allow: ['foo+script', 'foo+bar'] }
        );
        assert.strictEqual(ctx.schemeMap.get('foo+script'), true);
        assert.strictEqual(ctx.schemeMap.get('foo+bar'), true);
      });
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
        const ctx = new SanitizeContext({}, { debug: true });
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
        const ctx = new SanitizeContext({}, { debug: false });
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
      filter = new SanitizeFilter(DEFAULT_OPTS);
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
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        for (const value of invalidBuffers) {
          const res = await filter.sanitizeBuffer(value, 'text/plain', opt);
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
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeBuffer(buffer, 'text/plain', opt);
        assert.strictEqual(res, 'data:text/plain,hello', 'result');
      });

      it('successfully encodes valid buffer to data URL regardless of mime type', async () => {
        // "hello" as Uint8Array
        const buffer = new Uint8Array([104, 101, 108, 108, 111]).buffer;
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeBuffer(buffer, 'image/png', opt);
        assert.strictEqual(res, 'data:image/png,hello', 'result');
      });

      it('preserves base64 encoding for real binary data', async () => {
        const buffer = new Uint8Array([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
        ]).buffer;
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeBuffer(buffer, 'image/png', opt);
        assert.strictEqual(res, 'data:image/png;base64,iVBORw0KGgo=', 'result');
      });

      it('returns null if the Data URL fails to parse', async () => {
        const buffer = new ArrayBuffer(8);
        const parseStub = sinon.stub(URL, 'parse').returns(null);
        try {
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data']
          };
          const res = await filter.sanitizeBuffer(buffer, 'image/png', opt);
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

      it('throws RangeError when constructed URL length exceeds max length', async () => {
        const buffer = new Uint8Array(50).buffer;
        let caughtError = null;
        try {
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data'],
            maxLength: 30
          };
          await filter.sanitizeBuffer(buffer, 'image/png', opt);
        } catch (e) {
          caughtError = e;
        }
        assert.ok(caughtError instanceof RangeError, 'should throw RangeError');
        assert.ok(
          caughtError.message.includes('exceeds max length 30.'),
          'error message'
        );
      });

      describe('Data URL construction based on mimeType', () => {
        it('constructs Data URL with mimeType when mimeType is provided', async () => {
          const base64Png =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          const buffer = Uint8Array.from(atob(base64Png), c =>
            c.charCodeAt(0)
          ).buffer;
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data']
          };
          const res = await filter.sanitizeBuffer(buffer, 'image/png', opt);
          assert.ok(
            typeof res === 'string' && res.startsWith('data:image/png;base64,'),
            'result should be a data URL starting with "data:image/png;base64,"'
          );
        });

        it('constructs Data URL without mimeType when mimeType is empty or null', async () => {
          const encoder = new TextEncoder();
          const buffer = encoder.encode('Hello World').buffer;
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data']
          };
          const res = await filter.sanitizeBuffer(buffer, '', opt);
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
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL('https://example.com/', opt);
        assert.deepEqual(res, null, 'result');
      });

      it('returns null if the data scheme is not explicitly allowed', async () => {
        const res = await filter.sanitizeDataURL('data:text/plain,hello');
        assert.deepEqual(res, null, 'result');
      });

      it('returns a sanitized string when the data scheme is explicitly allowed', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL('data:text/plain,hello', opt);
        assert.strictEqual(res, 'data:text/plain,hello', 'result');
      });

      it('strips malicious scripts from HTML data URLs', async () => {
        const url =
          'data:text/html,<script>alert("XSS")</script><div>Hello</div>';
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL(url, opt);
        assert.strictEqual(
          res,
          'data:text/html,%3Cdiv%3EHello%3C/div%3E',
          'result'
        );
      });

      it('returns null for unparseable or invalid base64 data URLs', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL(
          'data:text/html;base64,invalid!base64',
          opt
        );
        assert.deepEqual(res, null, 'result');
      });

      it('throws RangeError when URL length exceeds max length', async () => {
        const url = 'data:text/plain,hello'; // 21
        let caughtError = null;
        try {
          const opt = {
            ...DEFAULT_OPTS,
            maxLength: 10
          };
          await filter.sanitizeDataURL(url, opt);
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
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL('http://[::1', opt);
        assert.deepEqual(
          res,
          null,
          'should return null for malformed URL string'
        );
      });

      it('returns null when inner URL parsing returns null', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL(
          'data:text/html,http://[::1',
          opt
        );
        assert.deepEqual(
          res,
          null,
          'should return null when inner URL parsing fails'
        );
      });

      it('returns null when content becomes completely empty after DOMPurify sanitization', async () => {
        const url = 'data:text/html,<script>alert("XSS")</script>';
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL(url, opt);
        assert.deepEqual(
          res,
          null,
          'should return null when sanitized content results in empty string'
        );
      });

      it('successfully decodes URI-encoded DOM string in #purify', async () => {
        const url = 'data:text/html,%3Cdiv%3EHello%3C/div%3E';
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL(url, opt);
        assert.strictEqual(
          res,
          'data:text/html,%3Cdiv%3EHello%3C/div%3E',
          'should decode and sanitize URI-encoded HTML correctly'
        );
      });

      it('falls back to original string when decodeURIComponent throws an error', async () => {
        const url = 'data:text/html,%E0%80invalid';
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['data']
        };
        const res = await filter.sanitizeDataURL(url, opt);
        assert.notStrictEqual(
          res,
          null,
          'should catch URIError and fall back to original string gracefully'
        );
      });

      describe('inner URL scheme validation', () => {
        it('returns null if inner URL scheme contains script (e.g. javascript:)', async () => {
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data']
          };
          const res = await filter.sanitizeDataURL(
            'data:text/html,javascript:alert(1)',
            opt
          );
          assert.deepEqual(
            res,
            null,
            'should return null when inner scheme is javascript'
          );
        });

        it('returns null if inner URL scheme contains blob (e.g. blob:)', async () => {
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data']
          };
          const res = await filter.sanitizeDataURL(
            'data:text/html,blob:https://example.com/uuid',
            opt
          );
          assert.deepEqual(
            res,
            null,
            'should return null when inner scheme is blob'
          );
        });

        it('returns early if URL.parse returns null for the attribute', async () => {
          const parseStub = sinon
            .stub(URL, 'parse')
            .callsFake((urlStr, base) => {
              if (urlStr === 'data:text/html,error-trigger') {
                return null;
              }
              return parseStub.wrappedMethod(urlStr, base);
            });
          try {
            const html = '<a href="data:text/html,error-trigger">link</a>';
            const url = `data:text/html,${html}`;
            const opt = {
              ...DEFAULT_OPTS,
              allow: ['data']
            };
            const res = await filter.sanitizeDataURL(url, opt);
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

        it('sets attrValue to empty string if circular reference is detected', async () => {
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
            const opt = {
              ...DEFAULT_OPTS,
              allow: ['data'],
              debug: true
            };
            const res = await filter.sanitizeDataURL(
              'data:text/html,<img src="data:text/html,loop">',
              opt
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

        it('sets attrValue to empty string if inner sanitization fails or returns null', async () => {
          const innerUrl = 'data:text/html,<script>alert(1)</script>';
          const url = `data:text/html,<img src="${innerUrl}">`;
          const opt = {
            ...DEFAULT_OPTS,
            allow: ['data']
          };
          const res = await filter.sanitizeDataURL(url, opt);
          assert.strictEqual(
            res,
            'data:text/html,%3Cimg%20src=%22%22%3E',
            'malicious inner data URL should be stripped and set to empty string'
          );
        });
      });

      describe('base64 parsing error handling', () => {
        it('logs debug message when base64 parsing fails and debug is true', async () => {
          const warnStub = sinon.stub(console, 'warn');
          try {
            const opt = {
              ...DEFAULT_OPTS,
              allow: ['data'],
              debug: true
            };
            const res = await filter.sanitizeDataURL(
              'data:text/html;base64,invalid!base64',
              opt
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
            const opt = {
              ...DEFAULT_OPTS,
              allow: ['data'],
              debug: false
            };
            const res = await filter.sanitizeDataURL(
              'data:text/html;base64,invalid!base64',
              opt
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
            const opt = {
              ...DEFAULT_OPTS,
              allow: ['data'],
              debug: true
            };
            const res = await filter.sanitizeDataURL(url, opt);
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
            const opt = {
              ...DEFAULT_OPTS,
              allow: ['data'],
              debug: false
            };
            const res = await filter.sanitizeDataURL(url, opt);
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

    describe('sanitizeURL()', () => {
      it('returns null for missing or non-string input', async () => {
        assert.deepEqual(await filter.sanitizeURL(null, 'https'), null);
        assert.deepEqual(await filter.sanitizeURL(undefined, 'https'), null);
        assert.deepEqual(await filter.sanitizeURL(12345, 'https'), null);
      });

      it('throws RangeError when URL length exceeds max length', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          maxLength: 10
        };
        await assert.rejects(
          async () => {
            await filter.sanitizeURL('https://example.com', 'https', opt);
          },
          RangeError,
          'should throw RangeError when length exceeds limit'
        );
      });

      it('returns early for standard HTTPS URLs without restrictive rules', async () => {
        const res = await filter.sanitizeURL(
          'https://example.com',
          'https',
          DEFAULT_OPTS
        );
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('processes URL through SanitizeContext when restrictive rules exist', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          allowRelative: true
        };
        const res = await filter.sanitizeURL('/relative/path', 'https', opt);
        assert.strictEqual(res, '/relative/path', 'result');
      });

      it('returns null if standard fast-path URL scheme is not in allowed schemes', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          schemes: new Set(['http']) // https is excluded
        };
        const res = await filter.sanitizeURL(
          'https://example.com',
          'https',
          opt
        );
        assert.deepEqual(
          res,
          null,
          'result should be null when scheme is not allowed'
        );
      });

      it('returns null if the compound scheme itself is denied', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['foo+bar'],
          deny: ['foo+bar']
        };
        const res = await filter.sanitizeURL(
          'foo+bar://example.com',
          'foo+bar',
          opt
        );
        assert.strictEqual(
          res,
          null,
          'should return null when the compound scheme itself is denied'
        );
      });

      it('returns null if any part of the compound scheme is denied', async () => {
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['foo+bar'],
          deny: ['foo']
        };
        const res = await filter.sanitizeURL(
          'foo+bar://example.com',
          'foo+bar',
          opt
        );
        assert.strictEqual(
          res,
          null,
          'should return null when any part of the compound scheme is denied'
        );
      });
    });

    describe('sanitizeURLSync()', () => {
      it('returns null for missing input, non-string input, or scheme === "data"', () => {
        assert.deepEqual(filter.sanitizeURLSync(null, 'https'), null);
        assert.deepEqual(filter.sanitizeURLSync(12345, 'https'), null);
        assert.deepEqual(
          filter.sanitizeURLSync('https://example.com', 'data'),
          null
        );
      });

      it('throws RangeError when URL length exceeds max length', () => {
        const opt = {
          ...DEFAULT_OPTS,
          maxLength: 10
        };
        assert.throws(
          () => {
            filter.sanitizeURLSync('https://example.com', 'https', opt);
          },
          RangeError,
          'should throw RangeError when length exceeds limit'
        );
      });

      it('returns early via fast-path for standard http/https schemes without restrictive rules', () => {
        const res = filter.sanitizeURLSync(
          'https://example.com',
          'https',
          DEFAULT_OPTS
        );
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('processes URL synchronously when fast-path conditions are not met', () => {
        const opt = {
          ...DEFAULT_OPTS,
          allowRelative: true
        };
        const res = filter.sanitizeURLSync('/relative/path', 'https', opt);
        assert.strictEqual(res, '/relative/path', 'result');
      });

      it('returns null if scheme does not match fast-path regex', () => {
        const opt = {
          ...DEFAULT_OPTS,
          allow: ['ftp']
        };
        const res = filter.sanitizeURLSync('ftp://example.com', 'ftp', opt);
        // Falls through to process() with SanitizeContext(null, opt)
        assert.strictEqual(res, 'ftp://example.com/', 'result');
      });

      it('returns null if standard fast-path URL scheme is not in allowed schemes', () => {
        const opt = {
          ...DEFAULT_OPTS,
          schemes: new Set(['http']) // https is excluded
        };
        const res = filter.sanitizeURLSync('https://example.com', 'https', opt);
        assert.deepEqual(
          res,
          null,
          'result should be null when scheme is not allowed'
        );
      });
    });
  });
});
