/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import urlSanitizer, {
  inspectURL,
  isURISync,
  isValidURI,
  sanitizeURL,
  sanitizeURLSync
} from '../src/index.js';

describe('URL Sanitizer', () => {
  describe('urlSanitizer', () => {
    it('should have methods', () => {
      assert.strictEqual(typeof urlSanitizer.get, 'function', 'get');
      assert.strictEqual(typeof urlSanitizer.has, 'function', 'has');
      assert.strictEqual(typeof urlSanitizer.add, 'function', 'add');
      assert.strictEqual(typeof urlSanitizer.remove, 'function', 'remove');
    });

    describe('get', () => {
      it('should get value', () => {
        const schemes = urlSanitizer.get();
        assert.strictEqual(Array.isArray(schemes), true, 'result');
      });
    });

    describe('has', () => {
      it('should get result', () => {
        const res = urlSanitizer.has('https');
        assert.strictEqual(res, true, 'result');
      });

      it('should get result', () => {
        const res = urlSanitizer.has('foo');
        assert.strictEqual(res, false, 'result');
      });
    });

    describe('add', () => {
      it('should get value', () => {
        assert.strictEqual(urlSanitizer.has('foo'), false);
        const res = urlSanitizer.add('foo');
        assert.strictEqual(urlSanitizer.has('foo'), true);
        assert.strictEqual(Array.isArray(res), true, 'result');
        urlSanitizer.remove('foo');
      });
    });

    describe('remove', () => {
      it('should get result', () => {
        assert.strictEqual(urlSanitizer.has('aaa'), true);
        const res = urlSanitizer.remove('aaa');
        assert.strictEqual(urlSanitizer.has('aaa'), false);
        assert.strictEqual(res, true, 'result');
        urlSanitizer.add('aaa');
      });

      it('should get result', () => {
        assert.strictEqual(urlSanitizer.has('foo'), false);
        const res = urlSanitizer.remove('foo');
        assert.strictEqual(res, false, 'result');
      });
    });
  });

  describe('sanitize URL', () => {
    it('should get null for javascript: scheme', async () => {
      const url = 'javascript:alert(1)';
      const res = await sanitizeURL(url);
      assert.strictEqual(res, null, 'result');
    });

    it('should get null for javascript: scheme even if inculed in allow list', async () => {
      const url = 'javascript:alert(1)';
      const res = await sanitizeURL(url, {
        allow: ['javascript']
      });
      assert.strictEqual(res, null, 'result');
    });

    it('should get result', async () => {
      const url =
        'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = await sanitizeURL(url);
      assert.strictEqual(res, 'http://example.com/', 'result');
    });

    it('should get result', async () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const url = `data:text/html,${encodeURIComponent(data)}`;
      const res = await sanitizeURL(url, {
        allow: ['data']
      });
      assert.strictEqual(
        res,
        'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E',
        'result'
      );
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div></div><p></p>',
        'decode'
      );
    });

    it('should get result', async () => {
      const base64data = btoa('<div><script>alert(1);</script></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = await sanitizeURL(url, {
        allow: ['data']
      });
      assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3C/div%3E', 'result');
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div></div>',
        'decode'
      );
    });

    it('should get result', async () => {
      const base64data = btoa('<div><img src="javascript:alert(1)"></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = await sanitizeURL(url, {
        allow: ['data']
      });
      assert.strictEqual(
        res,
        'data:text/html,%3Cdiv%3E%3Cimg%3E%3C/div%3E',
        'result'
      );
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div><img></div>',
        'decode'
      );
    });

    it('should get sanitized value', async () => {
      const data = '<svg><g onload="alert(1)"/></svg>';
      const blob = new Blob([data], {
        type: 'image/svg+xml'
      });
      const url = URL.createObjectURL(blob);
      const res = await sanitizeURL(url, {
        allow: ['blob']
      });
      URL.revokeObjectURL(url);
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

    it('should get sanitized value', async () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const blob = new Blob([data], {
        type: 'text/html'
      });
      const url = URL.createObjectURL(blob);
      const res = await sanitizeURL(url, {
        allow: ['blob']
      });
      URL.revokeObjectURL(url);
      assert.strictEqual(
        res,
        'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E',
        'result'
      );
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div></div><p></p>',
        'decoded'
      );
    });

    it('should get null', async () => {
      const res = await sanitizeURL('web+foo://example.com', {
        deny: ['web+foo']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should get null', async () => {
      const res = await sanitizeURL('http://example.com', {
        only: ['data', 'git', 'https']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should get result', async () => {
      const url = 'https://example.com/"onmouseover="alert(1)"';
      const res = await sanitizeURL(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res, 'https://example.com/', 'result');
    });

    it('should get result', async () => {
      const url = 'git+https://example.com/foo.git?<script>alert(1)</script>';
      const res = await sanitizeURL(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res, 'git+https://example.com/foo.git', 'result');
    });

    it('should get null', async () => {
      const url = 'javascript&colon;alert(1)';
      const res = await sanitizeURL(url);
      assert.deepEqual(res, null, 'result');
    });

    it('should get null', async () => {
      const url = 'javasc&Tab;ript:alert(1);';
      const res = await sanitizeURL(url);
      assert.deepEqual(res, null, 'result');
    });

    it('should not mutate original opt object when sanitizing blob URLs', async () => {
      const data = '<div><script>alert(1);</script></div>';
      const blob = new Blob([data], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const opt = {
        allow: ['blob'],
        deny: []
      };
      await sanitizeURL(blobUrl, opt);
      URL.revokeObjectURL(blobUrl);
      assert.deepEqual(
        opt.allow,
        ['blob'],
        'opt.allow should remain unchanged'
      );
      assert.deepEqual(opt.deny, [], 'opt.deny should remain unchanged');
    });

    it('should enforce "only" over "allow" and "deny"', async () => {
      const res1 = await sanitizeURL('http://example.com', {
        only: ['https', 'data'],
        allow: ['http']
      });
      assert.strictEqual(
        res1,
        null,
        'http should be denied because it is not in "only", despite being in "allow"'
      );
      const res2 = await sanitizeURL(
        'https://example.com/"onmouseover="alert(1)"',
        {
          only: ['https'],
          deny: ['https']
        }
      );

      assert.strictEqual(
        res2,
        'https://example.com/',
        'https should be allowed because "only" takes top priority over "deny"'
      );
    });

    it('should resolve regardless of scheme casing', async () => {
      const res = await sanitizeURL('HTTP://example.com', {
        deny: ['http']
      });
      assert.strictEqual(
        res,
        null,
        'HTTP:// (uppercase) should be denied when "http" is in deny list'
      );
    });

    it('should resolve regardless of casing and trailing colon', async () => {
      const res = await sanitizeURL('HTTP://example.com', {
        only: ['https']
      });
      assert.strictEqual(
        res,
        null,
        'HTTP:// (uppercase) should be denied when not matching "only" list'
      );
    });

    it('should handle nested/composite schemes', async () => {
      const res1 = await sanitizeURL('git+https://example.com/repo.git', {
        deny: ['https']
      });
      assert.strictEqual(
        res1,
        null,
        'git+https should be denied if "https" scheme is in deny list'
      );
      const res2 = await sanitizeURL('git+https://example.com/repo.git', {
        only: ['git+https']
      });
      assert.strictEqual(
        res2,
        'git+https://example.com/repo.git',
        'git+https should be allowed when specified in "only"'
      );
    });

    it('should process concurrent sanitization without DOMPurify hook collisions', async () => {
      // Create distinct Blob objects containing nested Data URLs with different XSS payloads
      const blob1 = new Blob(
        [
          '<a href="data:text/html,<script>alert(\'XSS 1\')</script>">Link 1</a>'
        ],
        { type: 'text/html' }
      );
      const blob2 = new Blob(
        [
          '<a href="data:text/html,<img src=x onerror=alert(\'XSS 2\')>">Link 2</a>'
        ],
        { type: 'text/html' }
      );
      // Generate temporary Object URLs
      const url1 = URL.createObjectURL(blob1);
      const url2 = URL.createObjectURL(blob2);
      // Execute sanitization concurrently
      const [res1, res2] = await Promise.all([
        sanitizeURL(url1, { allow: ['blob', 'data'] }),
        sanitizeURL(url2, { allow: ['blob', 'data'] })
      ]);
      // Revoke Object URLs to prevent memory leaks
      URL.revokeObjectURL(url1);
      URL.revokeObjectURL(url2);
      const decodedRes1 = decodeURIComponent(res1);
      const decodedRes2 = decodeURIComponent(res2);
      // Verify that hooks operated independently and removed their payloads
      assert.strictEqual(
        decodedRes1.includes('<script>'),
        false,
        'Script payload from blob1 should be removed'
      );
      assert.strictEqual(
        decodedRes2.includes('onerror'),
        false,
        'Event handler payload from blob2 should be removed'
      );
      // Verify that closures prevented context collision
      assert.notEqual(
        res1,
        res2,
        'Concurrent sanitization outputs must remain distinct and not mixed'
      );
      // Verify that the legitimate parts of the nested data URLs survived
      assert.strictEqual(
        decodedRes1.includes('Link 1'),
        true,
        'Legitimate text from blob1 should remain intact'
      );
      assert.strictEqual(
        decodedRes2.includes('Link 2'),
        true,
        'Legitimate text from blob2 should remain intact'
      );
    });
  });

  describe('sanitize URL sync', () => {
    it('should get result', () => {
      const url =
        'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = sanitizeURLSync(url);
      assert.strictEqual(res, 'http://example.com/', 'result');
    });

    it('should get result', () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const url = `data:text/html,${encodeURIComponent(data)}`;
      const res = sanitizeURLSync(url, {
        allow: ['data']
      });
      assert.strictEqual(
        res,
        'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E',
        'result'
      );
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div></div><p></p>',
        'decode'
      );
    });

    it('should get result', () => {
      const base64data = btoa('<div><script>alert(1);</script></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = sanitizeURLSync(url, {
        allow: ['data']
      });
      assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3C/div%3E', 'result');
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div></div>',
        'decode'
      );
    });

    it('should get result', () => {
      const base64data = btoa('<div><img src="javascript:alert(1)"></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = sanitizeURLSync(url, {
        allow: ['data']
      });
      assert.strictEqual(
        res,
        'data:text/html,%3Cdiv%3E%3Cimg%3E%3C/div%3E',
        'result'
      );
      assert.strictEqual(
        decodeURIComponent(res),
        'data:text/html,<div><img></div>',
        'decode'
      );
    });

    it('should get null', async () => {
      const data = '<svg><g onload="alert(1)"/></svg>';
      const blob = new Blob([data], {
        type: 'image/svg+xml'
      });
      const url = URL.createObjectURL(blob);
      const res = sanitizeURLSync(url, {
        allow: ['blob']
      });
      URL.revokeObjectURL(url);
      assert.deepEqual(res, null, 'result');
    });

    it('should get null', () => {
      const res = sanitizeURLSync('web+foo://example.com', {
        deny: ['web+foo']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should get null', () => {
      const res = sanitizeURLSync('http://example.com', {
        only: ['data', 'git', 'https']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should get result', () => {
      const url = 'https://example.com/"onmouseover="alert(1)"';
      const res = sanitizeURLSync(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res, 'https://example.com/', 'result');
    });

    it('should get result', () => {
      const url = 'git+https://example.com/foo.git?<script>alert(1)</script>';
      const res = sanitizeURLSync(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res, 'git+https://example.com/foo.git', 'result');
    });
  });

  describe('inspect URL', () => {
    it('should get result', async () => {
      const res = await inspectURL('javascript:alert(1)');
      assert.deepEqual(
        res,
        {
          input: 'javascript:alert(1)',
          valid: false,
          href: null,
          reason: 'Sanitization failed (blocked by allowed schemes or rules).'
        },
        'result'
      );
    });

    it('should get result', async () => {
      const res = await inspectURL('https://example.com/?foo=bar#baz');
      assert.deepEqual(
        res,
        {
          input: 'https://example.com/?foo=bar#baz',
          valid: true,
          data: null,
          href: 'https://example.com/?foo=bar#baz',
          origin: 'https://example.com',
          protocol: 'https:',
          username: '',
          password: '',
          host: 'example.com',
          port: '',
          hostname: 'example.com',
          pathname: '/',
          search: '?foo=bar',
          hash: '#baz'
        },
        'result'
      );
    });

    it('should get result', async () => {
      const data = '<svg><g onclick="alert(1)"/></svg>';
      const res = await inspectURL(`data:image/svg+xml;base64,${btoa(data)}`);
      assert.deepEqual(
        res,
        {
          input:
            'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
          valid: true,
          data: {
            mime: 'image/svg+xml',
            base64: false,
            data: '%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'
          },
          href: 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          origin: 'null',
          protocol: 'data:',
          username: '',
          password: '',
          host: '',
          port: '',
          hostname: '',
          pathname: 'image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          search: '',
          hash: ''
        },
        'result'
      );
    });

    it('should get result', async () => {
      const data =
        'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = await inspectURL(`data:image/png;base64,${data}`);
      assert.deepEqual(
        res,
        {
          input:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          valid: true,
          data: {
            mime: 'image/png',
            base64: true,
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
          },
          href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          origin: 'null',
          protocol: 'data:',
          username: '',
          password: '',
          host: '',
          port: '',
          hostname: '',
          pathname:
            'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          search: '',
          hash: ''
        },
        'result'
      );
    });

    it('should get value', async () => {
      const blob = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
        type: 'image/svg+xml'
      });
      const url = URL.createObjectURL(blob);
      const res = await inspectURL(url);
      URL.revokeObjectURL(url);
      assert.deepEqual(
        res,
        {
          input: url,
          valid: true,
          data: {
            mime: 'image/svg+xml',
            base64: false,
            data: '%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E'
          },
          href: 'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          origin: 'null',
          protocol: 'data:',
          username: '',
          password: '',
          host: '',
          port: '',
          hostname: '',
          pathname: 'image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          search: '',
          hash: ''
        },
        'result'
      );
    });
  });

  describe('is valid URI', () => {
    it('should get result', () => {
      const res = isValidURI('https://example.com/foo');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', () => {
      const res = isValidURI('javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });

    it('should get result', () => {
      const res = isValidURI('mailto:foo@example.com');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', () => {
      const res = isValidURI('foo:bar');
      assert.strictEqual(res, false, 'result');
    });

    it('should get result', () => {
      const res = isValidURI('web+foo:bar');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', () => {
      const res = isValidURI('web+javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });
  });

  describe('is URI sync (deprecated)', () => {
    it('should get result', () => {
      const res = isURISync('https://example.com/foo');
      assert.strictEqual(res, true, 'result');
    });
  });
});
