/**
 * dist.url-sanitizer.test.js
 */

/* test */
import { assert } from '../../node_modules/chai/chai.js';
import urlSanitizer, {
  isURI, isURISync, parseURL, parseURLSync, sanitizeURL, sanitizeURLSync
} from '../../dist/url-sanitizer.js';

const { describe, it } = globalThis;
const isString = o => typeof o === 'string';

describe('dist URL Sanitizer', () => {
  describe('urlSanitizer', () => {
    it('should have methods', () => {
      assert.isFunction(urlSanitizer.get, 'get');
      assert.isFunction(urlSanitizer.has, 'has');
      assert.isFunction(urlSanitizer.add, 'add');
      assert.isFunction(urlSanitizer.remove, 'remove');
      assert.isFunction(urlSanitizer.reset, 'reset');
    });

    it('should get value', () => {
      const schemes = urlSanitizer.get();
      assert.isArray(schemes, 'result');
    });

    it('should get result', () => {
      const res1 = urlSanitizer.has('https');
      const res2 = urlSanitizer.has('foo');
      assert.isTrue(res1, 'result');
      assert.isFalse(res2, 'result');
    });

    it('should get value', () => {
      assert.isFalse(urlSanitizer.has('foo'));
      const res = urlSanitizer.add('foo');
      assert.isTrue(urlSanitizer.has('foo'));
      assert.isArray(res, 'result');
      urlSanitizer.remove('foo');
    });

    it('should get result', () => {
      assert.isTrue(urlSanitizer.has('aaa'));
      const res1 = urlSanitizer.remove('aaa');
      assert.isFalse(urlSanitizer.has('aaa'));
      assert.isTrue(res1, 'result');
      urlSanitizer.add('aaa');
      const res2 = urlSanitizer.remove('foo');
      assert.isFalse(res2, 'result');
    });
  });

  describe('sanitize URL', () => {
    it('should get result', async () => {
      const url = 'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = await sanitizeURL(url);
      assert.strictEqual(res,
        'http://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;?%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'http://example.com/&quot;onmouseover=&quot;alert(1)&quot;?&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;',
        'decode');
    });

    it('should get result', async () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const url = `data:text/html,${encodeURIComponent(data)}`;
      const res = await sanitizeURL(url, {
        allow: ['data']
      });
      assert.strictEqual(res,
        'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E', 'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:text/html,<div></div><p></p>', 'decode');
    });

    it('should get result', async () => {
      const base64data = btoa('<div><script>alert(1);</script></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = await sanitizeURL(url, {
        allow: ['data']
      });
      assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3C/div%3E', 'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:text/html,<div></div>', 'decode');
    });

    it('should get result', async () => {
      const base64data =
        btoa('<div><img src="javascript:alert(1)"></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = await sanitizeURL(url, {
        allow: ['data']
      });
      assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3Cimg%3E%3C/div%3E',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:text/html,<div><img></div>', 'decode');
    });

    it('should get result', async () => {
      const data = '<svg><g onload="alert(1)"/></svg>';
      const blob = new Blob([data], {
        type: 'image/svg+xml'
      });
      const url = URL.createObjectURL(blob);
      const res = await sanitizeURL(url, {
        allow: ['blob']
      });
      URL.revokeObjectURL(url);
      assert.strictEqual(res,
        'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:image/svg+xml,<svg><g></g></svg>',
        'decoded');
    });

    it('should get null', async () => {
      const res = await sanitizeURL('web+foo://example.com', {
        deny: ['web+foo']
      });
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await sanitizeURL('http://example.com', {
        only: ['data', 'git', 'https']
      });
      assert.isNull(res, 'result');
    });

    it('should get result', async () => {
      const url = 'https://example.com/"onmouseover="alert(1)"';
      const res = await sanitizeURL(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res,
        'https://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'https://example.com/&quot;onmouseover=&quot;alert(1)&quot;',
        'decode');
    });

    it('should get result', async () => {
      const url = 'git+https://example.com/foo.git?<script>alert(1)</script>';
      const res = await sanitizeURL(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res,
        'git+https://example.com/foo.git?%26lt;script%26gt;alert(1)%26lt;/script%26gt;',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'git+https://example.com/foo.git?&lt;script&gt;alert(1)&lt;/script&gt;',
        'decode');
    });

    it('should get sanitized value', async () => {
      const url = 'https://example.com/"onclick="alert(1)"';
      const res = await sanitizeURL(url, {
        allow: ['data', 'file'],
        remove: true
      });
      assert.strictEqual(res, 'https://example.com/', 'result');
    });
  });

  describe('sanitize URL sync', () => {
    it('should get result', () => {
      const url = 'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = sanitizeURLSync(url);
      assert.strictEqual(res,
        'http://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;?%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'http://example.com/&quot;onmouseover=&quot;alert(1)&quot;?&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;',
        'decode');
    });

    it('should get result', () => {
      const data =
        '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
      const url = `data:text/html,${encodeURIComponent(data)}`;
      const res = sanitizeURLSync(url, {
        allow: ['data']
      });
      assert.strictEqual(res,
        'data:text/html,%3Cdiv%3E%3C/div%3E%3Cp%3E%3C/p%3E', 'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:text/html,<div></div><p></p>', 'decode');
    });

    it('should get result', () => {
      const base64data = btoa('<div><script>alert(1);</script></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = sanitizeURLSync(url, {
        allow: ['data']
      });
      assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3C/div%3E', 'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:text/html,<div></div>', 'decode');
    });

    it('should get result', () => {
      const base64data =
        btoa('<div><img src="javascript:alert(1)"></div>');
      const url = `data:text/html;base64,${base64data}`;
      const res = sanitizeURLSync(url, {
        allow: ['data']
      });
      assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3Cimg%3E%3C/div%3E',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'data:text/html,<div><img></div>', 'decode');
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
      assert.isNull(res, 'result');
    });

    it('should get null', () => {
      const res = sanitizeURLSync('web+foo://example.com', {
        deny: ['web+foo']
      });
      assert.isNull(res, 'result');
    });

    it('should get null', () => {
      const res = sanitizeURLSync('http://example.com', {
        only: ['data', 'git', 'https']
      });
      assert.isNull(res, 'result');
    });

    it('should get result', () => {
      const url = 'https://example.com/"onmouseover="alert(1)"';
      const res = sanitizeURLSync(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res,
        'https://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'https://example.com/&quot;onmouseover=&quot;alert(1)&quot;',
        'decode');
    });

    it('should get result', () => {
      const url = 'git+https://example.com/foo.git?<script>alert(1)</script>';
      const res = sanitizeURLSync(url, {
        only: ['data', 'git', 'https']
      });
      assert.strictEqual(res,
        'git+https://example.com/foo.git?%26lt;script%26gt;alert(1)%26lt;/script%26gt;',
        'result');
      assert.strictEqual(decodeURIComponent(res),
        'git+https://example.com/foo.git?&lt;script&gt;alert(1)&lt;/script&gt;',
        'decode');
    });
  });

  describe('parse URL', () => {
    it('should get result', async () => {
      const res = await parseURL('javascript:alert(1)');
      assert.deepEqual(res, {
        input: 'javascript:alert(1)',
        valid: false
      }, 'result');
    });

    it('should get result', async () => {
      const res = await parseURL('https://example.com/?foo=bar#baz');
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
      const res = await parseURL(`data:image/svg+xml;base64,${btoa(data)}`);
      assert.deepEqual(res, {
        input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
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
      }, 'result');
    });

    it('should get result', async () => {
      const data = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = await parseURL(`data:image/png;base64,${data}`);
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
      const res = await parseURL(url);
      URL.revokeObjectURL(url);
      assert.deepEqual(res, items, 'result');
    });
  });

  describe('parse URL sync', () => {
    it('should get result', () => {
      const res = parseURLSync('javascript:alert(1)');
      assert.deepEqual(res, {
        input: 'javascript:alert(1)',
        valid: false
      }, 'result');
    });

    it('should get result', () => {
      const res = parseURLSync('https://example.com/?foo=bar#baz');
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
      const res = parseURLSync(`data:image/svg+xml;base64,${btoa(data)}`);
      assert.deepEqual(res, {
        input: 'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
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
      }, 'result');
    });

    it('should get result', () => {
      const data = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = parseURLSync(`data:image/png;base64,${data}`);
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
      const res = parseURLSync(url);
      URL.revokeObjectURL(url);
      assert.deepEqual(res, items, 'result');
    });
  });

  describe('is URI', () => {
    it('should get result', async () => {
      const res = await isURI('https://example.com/foo');
      assert.isTrue(res, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('javascript:alert(1)');
      assert.isFalse(res, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('mailto:foo@example.com');
      assert.isTrue(res, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('foo:bar');
      assert.isFalse(res, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('web+foo:bar');
      assert.isTrue(res, 'result');
    });

    it('should get result', async () => {
      const res = await isURI('web+javascript:alert(1)');
      assert.isFalse(res, 'result');
    });
  });

  describe('is URI sync', () => {
    it('should get result', () => {
      const res = isURISync('https://example.com/foo');
      assert.isTrue(res, 'result');
    });

    it('should get result', () => {
      const res = isURISync('javascript:alert(1)');
      assert.isFalse(res, 'result');
    });

    it('should get result', () => {
      const res = isURISync('mailto:foo@example.com');
      assert.isTrue(res, 'result');
    });

    it('should get result', () => {
      const res = isURISync('foo:bar');
      assert.isFalse(res, 'result');
    });

    it('should get result', () => {
      const res = isURISync('web+foo:bar');
      assert.isTrue(res, 'result');
    });

    it('should get result', () => {
      const res = isURISync('web+javascript:alert(1)');
      assert.isFalse(res, 'result');
    });
  });
});
