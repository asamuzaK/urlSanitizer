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
      const base64Data = btoa(data);
      const res = func(base64Data);
      assert.strictEqual(res, data, 'result');
    });
  });

  describe('parse URL encoded numeric character reference', () => {
    const func = mjs.parseUrlEncodedNumCharRef;

    it('should throw', () => {
      assert.throws(() => func());
    });

    it('should get value', () => {
      const str = 'Hello%2C%20World!';
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!', 'result');
    });

    it('should get value', () => {
      const comma = '&#44;';
      const l = '&#108';
      const o = '&#0111;';
      const str = `He${l}${l}o${comma}%20W${o}r${l}d!`;
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!', 'result');
    });

    it('should get value', () => {
      const nul = '&#x00';
      const comma = '&#x2C;';
      const l = '&#x6C';
      const o = '&#x006F;';
      const str = `He${l}${l}o${comma}%20${nul}W${o}r${l}d!`;
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!', 'result');
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

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.has('web+foo');
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
        const res = schemes.isURI('web+javascript:alert(1)');
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

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert("XSS")');
        assert.isNull(res, 'result');
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
        const res = sanitizer.sanitize('javascript:alert(1)');
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)');
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert(1)');
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)');
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
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize(`data:text/plain;charset=UTF-8;base64,${base64Data}`, {
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
          .sanitize('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', {
            allow: ['data']
          });
        assert.strictEqual(res,
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', 'decode');
      });

      it('should get sanitized value', () => {
        const data = 'Hello%2C%20World!';
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer
          .sanitize(`data:text/plain;charset=UTF-8;base64,${base64Data}`, {
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
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
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
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;script%26gt;alert(%26%2339;XSS%26%2339;);%26lt;/script%26gt;?%26lt;script%26gt;alert(1);%26lt;/script%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;?&lt;script&gt;alert(1);&lt;/script&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const innerUrl = `data:text/html,${encodedInnerData}`;
        const data = `<iframe src="${innerUrl}"></iframe>`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;iframe%20src=%26quot;data:text/html,%26lt;script%26gt;alert(1)%26lt;%2Fscript%26gt;%26quot;%26gt;%26lt;/iframe%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;iframe src=&quot;data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;&quot;&gt;&lt;/iframe&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const base64InnerData = btoa(encodedInnerData);
        const innerUrl = `data:text/html;base64,${base64InnerData}`;
        const data = `<iframe src="${innerUrl}"></iframe>`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;iframe%20src=%26quot;data:text/html,%26lt;script%26gt;alert(1)%26lt;%2Fscript%26gt;%26quot;%26gt;%26lt;/iframe%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;iframe src=&quot;data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;&quot;&gt;&lt;/iframe&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const innerData1 = '<script>alert(1)</script>';
        const innerUrl1 = `data:text/html,${innerData1}`;
        const outerData1 = `<iframe src="${innerUrl1}"></iframe>`;
        const innerData2 = '<script>alert(2)</script>';
        const base64InnerData2 = btoa(innerData2);
        const innerUrl2 = `data:text/html;base64,${base64InnerData2}`;
        const outerData2 = `<iframe src="${innerUrl2}"></iframe>`;
        const innerData3 = '<script>alert(3)</script>';
        const encodedInnerData3 = encodeURIComponent(innerData3);
        const innerUrl3 = `data:text/html,${encodedInnerData3}`;
        const outerData3 = `<iframe src="${innerUrl3}"></iframe>`;
        const data = `${outerData1}${outerData2}${outerData3}`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;iframe%20src=%26quot;data:text/html,%26lt;script%26gt;alert(1)%26lt;/script%26gt;%26quot;%26gt;%26lt;/iframe%26gt;%26lt;iframe%20src=%26quot;data:text/html,%26lt;script%26gt;alert(2)%26lt;/script%26gt;%26quot;%26gt;%26lt;/iframe%26gt;%26lt;iframe%20src=%26quot;data:text/html,%26lt;script%26gt;alert(3)%26lt;%2Fscript%26gt;%26quot;%26gt;%26lt;/iframe%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;iframe src=&quot;data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;&quot;&gt;&lt;/iframe&gt;&lt;iframe src=&quot;data:text/html,&lt;script&gt;alert(2)&lt;/script&gt;&quot;&gt;&lt;/iframe&gt;&lt;iframe src=&quot;data:text/html,&lt;script&gt;alert(3)&lt;/script&gt;&quot;&gt;&lt;/iframe&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        let url;
        for (let i = 0; i < 4; i++) {
          let srcUrl;
          if (url) {
            srcUrl = url;
          } else {
            srcUrl = `https://example.com/?q=${i}`;
          }
          const html = `<iframe src="${srcUrl}"></iframe>`;
          const htmlBase64 = btoa(html);
          url = `data:text/html;base64,${htmlBase64}`;
        }
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;iframe%20src=%26quot;data:text/html,%26lt;iframe%20src=%26quot;data:text/html,%26lt;iframe%20src=%26quot;data:text/html,%26lt;iframe%20src=%26quot;https://example.com/?q=0%26quot;%26gt;%26lt;/iframe%26gt;%26quot;%26gt;%26lt;/iframe%26gt;%26quot;%26gt;%26lt;/iframe%26gt;%26quot;%26gt;%26lt;/iframe%26gt;', 'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;iframe src=&quot;data:text/html,&lt;iframe src=&quot;data:text/html,&lt;iframe src=&quot;data:text/html,&lt;iframe src=&quot;https://example.com/?q=0&quot;&gt;&lt;/iframe&gt;&quot;&gt;&lt;/iframe&gt;&quot;&gt;&lt;/iframe&gt;&quot;&gt;&lt;/iframe&gt;',
          'decode');
      });

      it('should throw', () => {
        let url;
        for (let i = 0; i < 18; i++) {
          let srcUrl;
          if (url) {
            srcUrl = url;
          } else {
            srcUrl = `https://example.com/?q=${i}`;
          }
          const html = `<iframe src="${srcUrl}"></iframe>`;
          const htmlBase64 = btoa(html);
          url = `data:text/html;base64,${htmlBase64}`;
        }
        const sanitizer = new URLSanitizer();
        assert.throws(() => sanitizer.sanitize(url, {
          allow: ['data']
        }), 'The nesting of data URLs is too deep.');
      });

      it('should get null', () => {
        const url = 'data:,javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const url = 'data:,JAVASCRIPT:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc%72ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc\u0072ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const url = 'data:,\u2028javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('FIXME: should get null', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('FIXME: should get null', () => {
        const url = 'data:,&#xA0javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('FIXME: should get null', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)?foo=bar&baz=qux';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', () => {
        const url =
          'data:text/html,<iframe src="javascript:alert(1)"></iframe>';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;iframe%20src=%26quot;javascript:alert(1)%26quot;%26gt;%26lt;/iframe%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;/iframe&gt;',
          'decode');
      });

      it('should get sanitized value', () => {
        const xss = btoa('javascript:alert(1)');
        const url =
          `data:text/html,<iframe src="data:base64,${xss}"></iframe>`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%26lt;iframe%20src=%26quot;data:,javascript:alert(1)%26quot;%26gt;%26lt;/iframe%26gt;',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,&lt;iframe src=&quot;data:,javascript:alert(1)&quot;&gt;&lt;/iframe&gt;',
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
