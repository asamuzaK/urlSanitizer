/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';
import { getType, isString } from '../scripts/common.js';

/* test */
import urlSanitizer, {
  inspectURL,
  isURISync,
  isValidURI,
  sanitizeURL,
  sanitizeURLSync
} from '../src/index.js';

describe('URL Sanitizer', () => {
  describe('urlSanitizer instance', () => {
    it('should have methods', () => {
      assert.strictEqual(typeof urlSanitizer.get, 'function', 'get');
      assert.strictEqual(typeof urlSanitizer.has, 'function', 'has');
      assert.strictEqual(typeof urlSanitizer.add, 'function', 'add');
      assert.strictEqual(typeof urlSanitizer.remove, 'function', 'remove');
    });

    it('exports all expected utility aliases', () => {
      assert.strictEqual(typeof sanitizeURL, 'function');
      assert.strictEqual(typeof sanitizeURLSync, 'function');
      assert.strictEqual(typeof inspectURL, 'function');
      assert.strictEqual(typeof isValidURI, 'function');
      assert.strictEqual(typeof isURISync, 'function');
    });
  });

  describe('alias behavior', () => {
    describe('sanitize URL', () => {
      const func = sanitizeURL;

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

      it('allows and sanitizes relative URLs', async () => {
        const url = '/path/to/resource?query=1#hash';
        const res = await func(url, { allowRelative: true });
        assert.strictEqual(
          res,
          url,
          'result should be the sanitized relative URL'
        );
      });

      it('returns null for relative URLs', async () => {
        const url = '/path/to/resource';
        const res = await func(url, { debug: true, allowRelative: false });
        assert.strictEqual(res, null, 'result should be null');
      });

      it('does not throw TypeError when options arrays are overridden by invalid types', async () => {
        const data = '<svg><g></g></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const invalidValues = [
          null,
          undefined,
          'not-an-array',
          { length: 1, 0: 'blob' },
          123,
          true
        ];
        for (const val of invalidValues) {
          let error = null;
          let res;
          try {
            res = await func(url, {
              allow: val,
              deny: val,
              only: val
            });
          } catch (e) {
            error = e;
          }
          assert.strictEqual(
            error,
            null,
            `Should not throw error when options contain ${getType(val)}`
          );
          assert.deepEqual(
            res,
            null,
            `Result should be null when options contain ${getType(val)}`
          );
        }
        URL.revokeObjectURL(url);
      });
    });

    describe('sanitize URL sync', () => {
      const func = sanitizeURLSync;

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

      it('returns false for invalid URL input', () => {
        const invalidUrl = 'invalid-url-string';
        const res = func(invalidUrl);
        assert.strictEqual(res, null, 'result should be null');
      });

      it('allows and sanitizes relative URLs', () => {
        const url = '/path/to/resource?query=1#hash';
        const res = func(url, { allowRelative: true });
        assert.strictEqual(
          res,
          url,
          'result should be the sanitized relative URL'
        );
      });

      it('returns null for relative URLs when allowRelative is false', () => {
        const res = func('/path/to/resource', { allowRelative: false });
        assert.deepEqual(res, null, 'result should be null');
      });
    });

    describe('inspect URL', () => {
      const func = inspectURL;

      it('returns invalid URL result for undefined input', async () => {
        const res = await func();
        assert.deepEqual(
          res,
          {
            input: undefined,
            valid: false,
            href: null,
            reason: 'Invalid URL input: undefined'
          },
          'result'
        );
      });

      it('returns invalid URL result for empty string input', async () => {
        const res = await func('');
        assert.deepEqual(
          res,
          {
            input: '',
            valid: false,
            href: null,
            reason: 'Invalid URL input: (empty string)'
          },
          'result'
        );
      });

      it('returns invalid URL result for invalid blob URL', async () => {
        const msg = await fetch('blob:').catch(e => e.message);
        const res = await func('blob:');
        assert.deepEqual(
          res,
          {
            input: 'blob:',
            valid: false,
            reason: msg
          },
          'result'
        );
      });

      it('returns inspected URL result correctly for blob URL', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const obj = new URL(
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'
        );
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
          base64: false,
          data: '%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          mime: 'image/svg+xml'
        };
        const res = await func(url);
        assert.deepEqual(res, items, 'result');
      });

      it('returns inspected URL result correctly', async () => {
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
        const res = await func(url);
        assert.deepEqual(res, items, 'result');
      });

      it('formats Data URL with only base64 for blob URLs without mimeType', async () => {
        const data = 'Hello, Blob!';
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        const res = await func(url);
        assert.strictEqual(res.valid, true, 'result should be valid');
        assert.deepEqual(
          res.data,
          {
            mime: '',
            base64: false,
            data
          },
          'data URL components should be parsed and decoded correctly'
        );
        URL.revokeObjectURL(url);
      });
    });

    describe('is valid URI', () => {
      const func = isValidURI;

      it('identifies valid and registered scheme securely', async () => {
        const res = func('https://example.com');
        assert.strictEqual(res, true, 'result');
      });
    });
  });
});
