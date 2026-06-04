/**
 * dist.url-sanitizer.test.js
 */

/* test */
import { assert } from '../../node_modules/chai/index.js';
import urlSanitizer, {
  inspectURL, inspectURLSync, isURI, isURISync, sanitizeURL, sanitizeURLSync
} from '../../dist/url-sanitizer-wo-dompurify.min.js';

const { describe, it } = globalThis;
const isString = o => typeof o === 'string';

describe('dist URL Sanitizer', () => {
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
      const url = 'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = await sanitizeURL(url);
      assert.strictEqual(res, 'http://example.com/', 'result');
    });

    it('should throw', async () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const url = `data:text/html,${encodeURIComponent(data)}`;
      let err;
      const res = await sanitizeURL(url, {
        allow: ['data']
      }).catch(e => {
        err = e;
      });
      assert.strictEqual(err instanceof Error, true);
      assert.strictEqual(res, undefined);
    });

    it('should throw', async () => {
      const base64data = btoa('<div><script>alert(1);</script></div>');
      const url = `data:text/html;base64,${base64data}`;
      let err;
      const res = await sanitizeURL(url, {
        allow: ['data']
      }).catch(e => {
        err = e;
      });
      assert.strictEqual(err instanceof Error, true);
      assert.strictEqual(res, undefined);
    });

    it('should throw', async () => {
      const base64data =
        btoa('<div><img src="javascript:alert(1)"></div>');
      const url = `data:text/html;base64,${base64data}`;
      let err;
      const res = await sanitizeURL(url, {
        allow: ['data']
      }).catch(e => {
        err = e;
      });
      assert.strictEqual(err instanceof Error, true);
      assert.strictEqual(res, undefined);
    });

    it('should throw', async () => {
      const data = '<svg><g onload="alert(1)"/></svg>';
      const blob = new Blob([data], {
        type: 'image/svg+xml'
      });
      const url = URL.createObjectURL(blob);
      let err;
      const res = await sanitizeURL(url, {
        allow: ['blob']
      }).catch(e => {
        err = e;
      });
      URL.revokeObjectURL(url);
      assert.strictEqual(err instanceof Error, true);
      assert.strictEqual(res, undefined);
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
  });

  describe('sanitize URL sync', () => {
    it('should get result', () => {
      const url = 'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = sanitizeURLSync(url);
      assert.strictEqual(res, 'http://example.com/', 'result');
    });

    it('should throw', () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const url = `data:text/html,${encodeURIComponent(data)}`;
      assert.throws(() => sanitizeURLSync(url, {
        allow: ['data']
      }));
    });

    it('should throw', () => {
      const base64data = btoa('<div><script>alert(1);</script></div>');
      const url = `data:text/html;base64,${base64data}`;
      assert.throws(() => sanitizeURLSync(url, {
        allow: ['data']
      }));
    });

    it('should throw', () => {
      const base64data =
        btoa('<div><img src="javascript:alert(1)"></div>');
      const url = `data:text/html;base64,${base64data}`;
      assert.throws(() => sanitizeURLSync(url, {
        allow: ['data']
      }));
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
      assert.deepEqual(res, {
        input: 'javascript:alert(1)',
        valid: false,
        reason: 'Invalid URI syntax or scheme is not registered.'
      }, 'result');
    });

    it('should get result', async () => {
      const res = await inspectURL('https://example.com/?foo=bar#baz');
      assert.deepEqual(res, {
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
      }, 'result');
    });

    it('should get result', async () => {
      const data = '<svg><g onclick="alert(1)"/></svg>';
      const res = await inspectURL(`data:image/svg+xml;base64,${btoa(data)}`);
      assert.deepEqual(res, {
        input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
        valid: false,
        reason: 'DOMPurify is not available. Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
      }, 'result');
    });

    it('should get result', async () => {
      const data = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = await inspectURL(`data:image/png;base64,${data}`);
      assert.deepEqual(res, {
        input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
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
        pathname: 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        search: '',
        hash: ''
      }, 'result');
    });

    it('should get value', async () => {
      const blob = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
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
      const res = await inspectURL(url);
      URL.revokeObjectURL(url);
      assert.deepEqual(res, items, 'result');
    });
  });

  describe('inspect URL sync', () => {
    it('should get result', () => {
      const res = inspectURLSync('javascript:alert(1)');
      assert.deepEqual(res, {
        input: 'javascript:alert(1)',
        valid: false,
        reason: 'Invalid URI syntax or scheme is not registered.'
      }, 'result');
    });

    it('should get result', () => {
      const res = inspectURLSync('https://example.com/?foo=bar#baz');
      assert.deepEqual(res, {
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
      }, 'result');
    });

    it('should get result', () => {
      const data = '<svg><g onclick="alert(1)"/></svg>';
      const res = inspectURLSync(`data:image/svg+xml;base64,${btoa(data)}`);
      assert.deepEqual(res, {
        input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
        valid: false,
        reason: 'DOMPurify is not available. Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
      }, 'result');
    });

    it('should get result', () => {
      const data = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = inspectURLSync(`data:image/png;base64,${data}`);
      assert.deepEqual(res, {
        input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
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
        pathname: 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
        search: '',
        hash: ''
      }, 'result');
    });

    it('should get value', () => {
      const blob = new Blob(['<svg><g onload="alert(1)"/></svg>'], {
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
      const res = inspectURLSync(url);
      URL.revokeObjectURL(url);
      assert.deepEqual(res, items, 'result');
    });
  });

  describe('is URI', () => {
    it('should get result', async () => {
      const res = await isURI('https://example.com/foo');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('mailto:foo@example.com');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('foo:bar');
      assert.strictEqual(res, false, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('web+foo:bar');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('web+javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });
  });

  describe('is URI sync', () => {
    it('should get result', () => {
      const res = isURISync('https://example.com/foo');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', () => {
      const res = isURISync('javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });

    it('should get result', () => {
      const res = isURISync('mailto:foo@example.com');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', () => {
      const res = isURISync('foo:bar');
      assert.strictEqual(res, false, 'result');
    });

    it('should get result', () => {
      const res = isURISync('web+foo:bar');
      assert.strictEqual(res, true, 'result');
    });

    it('should get result', () => {
      const res = isURISync('web+javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });
  });
});
