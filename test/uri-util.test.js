/**
 * uri-scheme.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import urlSanitizer, * as mjs from '../src/mjs/uri-util.js';

describe('uri-scheme', () => {
  describe('default', () => {
    it('should be instance of URLSanitizer', () => {
      assert.instanceOf(urlSanitizer, mjs.URISchemes, 'instance');
      assert.instanceOf(urlSanitizer, mjs.URLSanitizer, 'instance');
    });
  });

  describe('get URL encoded string', () => {
    const func = mjs.getUrlEncodedString;

    it('should throw', () => {
      assert.throws(() => func());
    });

    it('should get empty string', () => {
      const res = func('');
      assert.strictEqual(res, '', 'result');
    });

    it('should get encoded string', () => {
      const res = func('foo bar');
      assert.strictEqual(res, '%66%6F%6F%20%62%61%72', 'result');
    });

    it('should get encoded string', () => {
      const res = func('&#<>"\'');
      assert.strictEqual(res, '%26%23%3C%3E%22%27', 'result');
    });
  });

  describe('escape URL encoded HTML special chars', () => {
    const func = mjs.escapeUrlEncodedHtmlChars;

    it('should throw', () => {
      assert.throws(() => func());
    });

    it('should throw', () => {
      assert.throws(() => func('foo'));
    });

    it('should throw', () => {
      assert.throws(() => func('%3G'));
    });

    it('should get unescaped char', () => {
      const res = func('%20');
      assert.strictEqual(res, '%20', 'result');
    });

    it('should get escaped char', () => {
      const res = func('%26');
      assert.strictEqual(res, '%26amp;', 'result');
    });

    it('should get escaped char', () => {
      const res = func('%3c');
      assert.strictEqual(res, '%26lt;', 'result');
    });

    it('should get escaped char', () => {
      const res = func('%3C');
      assert.strictEqual(res, '%26lt;', 'result');
    });

    it('should get escaped char', () => {
      const res = func('%3E');
      assert.strictEqual(res, '%26gt;', 'result');
    });

    it('should get escaped char', () => {
      const res = func('%22');
      assert.strictEqual(res, '%26quot;', 'result');
    });

    it('should get escaped char', () => {
      const res = func('%27');
      assert.strictEqual(res, '%26%2339;', 'result');
    });
  });

  describe('parse base64', () => {
    const func = mjs.parseBase64;

    it('should throw', () => {
      assert.throws(() => func());
    });

    it('should get data', () => {
      const data = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = func(data);
      assert.strictEqual(res, data, 'result');
    });

    it('should get parsed data', () => {
      const data = 'Hello%2C%20World!';
      const base64data = btoa(data);
      const res = func(base64data);
      assert.strictEqual(res, data, 'result');
    });
  });

  describe('URI schemes', () => {
    const { URISchemes } = mjs;

    it('should create instance', () => {
      const schemes = new URISchemes();
      assert.instanceOf(schemes, URISchemes, 'instance');
    });

    describe('get schemes', () => {
      it('should get array', () => {
        const schemes = new URISchemes();
        const res = schemes.get();
        assert.isArray(res, 'result');
      });
    });

    describe('has scheme', () => {
      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.has('https');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.has('moz-extension');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.has('foo');
        assert.isFalse(res, 'result');
      });
    });

    describe('add scheme', () => {
      it('should throw', () => {
        const schemes = new URISchemes();
        assert.throws(() => schemes.add(),
          'Expected String but got Undefined.');
      });

      it('should throw', () => {
        const schemes = new URISchemes();
        assert.throws(() => schemes.add('javascript'),
          'Invalid scheme: javascript');
      });

      it('should throw', () => {
        const schemes = new URISchemes();
        assert.throws(() => schemes.add('vbscript'),
          'Invalid scheme: vbscript');
      });

      it('should throw', () => {
        const schemes = new URISchemes();
        assert.throws(() => schemes.add('web+javascript'),
          'Invalid scheme: web+javascript');
      });

      it('should throw', () => {
        const schemes = new URISchemes();
        assert.throws(() => schemes.add('foo=bar'), 'Invalid scheme: foo=bar');
      });

      it('should add scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.add('foo');
        assert.isArray(res, 'result');
        assert.isTrue(res.includes('foo'), 'added');
      });

      it('should add scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.add('web+foo');
        assert.isArray(res, 'result');
        assert.isTrue(res.includes('web+foo'), 'added');
      });
    });

    describe('remove scheme', () => {
      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.remove('foo');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        schemes.add('foo');
        const res = schemes.remove('foo');
        assert.isTrue(res, 'result');
      });
    });

    describe('is URI', () => {
      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI();
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('foo');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('foo:bar');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        schemes.add('foo');
        const res = schemes.isURI('foo:bar');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('javascript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('Javas&#99;ript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('/../');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('../../');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('https://example.com');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI(' https://example.com ');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('https://example.com:8000/#foo?bar=baz');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('https://example.com foo');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('https://127.0.0.1');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('https://[::1]/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('file:///C:/Users/Foo/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('mailto:foo@example.com');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('ext+foo://example.com/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('web+foo://example.com/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('git+https://example.com/');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('foo+https://example.com/');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('git+foo://example.com/');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.isURI('URN:ISBN:4-8399-0454-5');
        assert.isTrue(res, 'result');
      });
    });
  });

  describe('URL sanitizer', () => {
    const { URLSanitizer } = mjs;

    it('should be instance of URLSanitizer', () => {
      const sanitizer = new URLSanitizer();
      assert.instanceOf(sanitizer, URLSanitizer, 'instance');
    });

    describe('sanitize URL', () => {
      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize();
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo');
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', 'foo');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', null);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res =
          sanitizer.sanitize('https://example.com:8000/#foo?bar=baz qux');
        assert.strictEqual(res, 'https://example.com:8000/#foo?bar=baz%20qux',
          'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com/?foo=bar&baz=qux');
        assert.strictEqual(res, 'https://example.com/?foo=bar&baz=qux',
          'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('../../');
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('/../');
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('javascript:alert("XSS")');
        assert.isNull(res, 'result');
      });

      it('should get null if data scheme is not explicitly allowed', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!');
        assert.isNull(res, 'result');
      });

      it('should override allow and get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data'],
          deny: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,Hello%2C%20World!', 'result');
        assert.strictEqual(decodeURIComponent(res), 'data:,Hello, World!',
          'decode');
      });

      it('should get value', () => {
        const data = 'Hello%2C%20World!';
        const base64data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize(`data:text/plain;charset=UTF-8;base64,${base64data}`, {
            allow: ['data']
          });
        assert.strictEqual(res,
          'data:text/plain;charset=UTF-8,Hello%2C%20World!', 'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/plain;charset=UTF-8,Hello, World!', 'decode');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize('data:image/svg+xml,%3Csvg%3E%3C/svg%3E', {
            allow: ['data'],
            escapeTags: false
          });
        assert.strictEqual(res,
          'data:image/svg+xml,%3Csvg%3E%3C/svg%3E', 'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:image/svg+xml,<svg></svg>', 'decode');
      });

      it('should get value', () => {
        const data = '<svg></svg>';
        const base64data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize(`data:image/svg+xml;base64,${base64data}`, {
            allow: ['data'],
            escapeTags: false
          });
        assert.strictEqual(res,
          'data:image/svg+xml,%3Csvg%3E%3C/svg%3E', 'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:image/svg+xml,<svg></svg>', 'decode');
      });

      it('should get sanitized value', () => {
        const data = 'Hello%2C%20World!';
        const base64data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize(`data:text/plain;charset=UTF-8;base64,${base64data}`, {
            allow: ['data']
          });
        assert.strictEqual(res,
          'data:text/plain;charset=UTF-8,Hello%2C%20World!', 'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/plain;charset=UTF-8,Hello, World!', 'decode');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize("data:text/html,<script>alert('XSS');</script>?<script>alert(1);</script>", {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;?%26lt;script%26gt;alert(1);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;?&lt;script&gt;alert(1);&lt;/script&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const data = "<script>alert('XSS');</script>?<script>alert(1);</script>";
        const base64data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;?%26lt;script%26gt;alert(1);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;?&lt;script&gt;alert(1);&lt;/script&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize("data:text/html,%3Cscript%3Ealert('XSS');%3C/script%3E?%3Cscript%3Ealert(1);%3C/script%3E", {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;?%26lt;script%26gt;alert(1);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;?&lt;script&gt;alert(1);&lt;/script&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const data = "%3Cscript%3Ealert('XSS');%3C/script%3E?%3Cscript%3Ealert(1);%3C/script%3E";
        const base64data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;?%26lt;script%26gt;alert(1);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;?&lt;script&gt;alert(1);&lt;/script&gt;',
          'decode');
      });

      it('should get null if file scheme is not explicitly allowed', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar');
        assert.isNull(res, 'result');
      });

      it('should override allow and get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar', {
          deny: ['file'],
          allow: ['file']
        });
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar', {
          allow: ['file']
        });
        assert.strictEqual(res, 'file:///foo/bar', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          allow: ['web+foo']
        });
        assert.strictEqual(res, 'web+foo:bar', 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          deny: ['web+foo']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('javascript:alert(1)', {
          allow: ['javascript']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)', {
          allow: ['vbscript']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert(1)', {
          allow: ['web+javascript']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)', {
          allow: ['web+vbscript']
        });
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('http://example.com/?lt=5&gt=4');
        const url = new URL(res);
        assert.strictEqual(res, 'http://example.com/?lt=5&gt=4', 'result');
        assert.deepEqual(Array.from(url.searchParams.entries()), [['lt', '5'], ['gt', '4']], 'search');
      });

      it('should get sanitized value', () => {
        const value = encodeURIComponent('5&gt=4');
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`http://example.com/?lt=${value}`);
        const url = new URL(res);
        assert.strictEqual(res, 'http://example.com/?lt=5%26amp;gt%3D4', 'result');
        assert.strictEqual(decodeURIComponent(res),
          'http://example.com/?lt=5&amp;gt=4', 'decode');
        assert.deepEqual(Array.from(url.searchParams.entries()), [['lt', '5&amp;gt=4']], 'search');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize("http://example.com/?<script>alert('XSS');</script>");
        const url = new URL(res);
        assert.strictEqual(res,
          'http://example.com/?%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'http://example.com/?&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;',
          'decode');
        assert.deepEqual(Array.from(url.searchParams.entries()), [['&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;', '']], 'search');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize("http://example.com/?foo=bar&<script>alert('XSS');</script>");
        const url = new URL(res);
        assert.strictEqual(res,
          'http://example.com/?foo=bar&%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'http://example.com/?foo=bar&&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;',
          'decode');
        assert.deepEqual(Array.from(url.searchParams.entries()), [['foo', 'bar'], ['&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;', '']], 'search');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res =
          sanitizer.sanitize('http://example.com/"onmouseover="alert(1)"');
        assert.strictEqual(res,
          'http://example.com/%26quot;onmouseover=%26quot;alert(1)%26quot;',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'http://example.com/&quot;onmouseover=&quot;alert(1)&quot;',
          'decode');
      });
    });
  });

  describe('alias', () => {
    it('should get aliases', () => {
      assert.isTrue(typeof mjs.isURI === 'function');
      assert.isTrue(typeof mjs.isURISync === 'function');
      assert.isTrue(typeof mjs.sanitizeURL === 'function');
      assert.isTrue(typeof mjs.sanitizeURLSync === 'function');
    });

    describe('is URI sync', () => {
      const func = mjs.isURISync;

      it('should get value', () => {
        const res = func('https://example.com');
        assert.isTrue(res, 'result');
      });
    });

    describe('is URI async', () => {
      const func = mjs.isURI;

      it('should get value', async () => {
        const res = await func('https://example.com');
        assert.isTrue(res, 'result');
      });
    });

    describe('sanitize URL sync', () => {
      const func = mjs.sanitizeURLSync;

      it('should get value', () => {
        const res = func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });
    });

    describe('sanitize URL async', () => {
      const func = mjs.sanitizeURL;

      it('should get value', async () => {
        const res = await func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });
    });
  });
});
