/**
 * sanitizer.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { isString } from '../modules/common.js';

/* test */
import urlSanitizer, * as mjs from '../src/mjs/sanitizer.js';

describe('sanitizer', () => {
  describe('default', () => {
    it('should be instance of URLSanitizer', () => {
      assert.instanceOf(urlSanitizer, mjs.URLSanitizer, 'instance');
    });
  });

  describe('URL sanitizer', () => {
    const { URLSanitizer } = mjs;

    it('should be instance of URLSanitizer', () => {
      const sanitizer = new URLSanitizer();
      assert.instanceOf(sanitizer, URLSanitizer, 'instance');
    });

    describe('replace matched data URLs', () => {
      it('should throw', () => {
        const sanitizer = new URLSanitizer();
        assert.throws(() => sanitizer.replace(),
          'Expected String but got Undefined.');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.replace('https://example.com');
        assert.strictEqual(res, 'https://example.com',
          'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.replace('data:,https://example.com');
        assert.strictEqual(res, 'data:,https://example.com',
          'result');
      });

      it('should get sanitized value', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const innerUrl = `data:text/html,${encodedInnerData}`;
        const data = `<img src="${innerUrl}">`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.replace(`data:text/html;base64,${base64Data}`);
        assert.strictEqual(res, 'data:text/html,%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,<img src="">',
          'decode');
      });

      it('should get sanitized value', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const base64InnerData = btoa(encodedInnerData);
        const innerUrl = `data:text/html;base64,${base64InnerData}`;
        const data = `<img src="${innerUrl}">`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.replace(`data:text/html;base64,${base64Data}`);
        assert.strictEqual(res, 'data:text/html,%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src="">', 'decode');
      });

      it('should get sanitized value', () => {
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
        const res = sanitizer.replace(`data:text/html;base64,${base64Data}`);
        assert.strictEqual(res,
          'data:text/html,%3Cimg%20src=%22%22%3E%3Cimg%20src=%22%22%3E%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src=""><img src=""><img src="">',
          'decode');
      });

      it('should get sanitized value', () => {
        const data = '<div><img src="data:image/svg+xml,<svg></svg>"></div>';
        const base64Data = btoa(data);
        const url = `data:text/html;base64,${base64Data}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.replace(url);
        assert.strictEqual(res,
          'data:text/html,%3Cdiv%3E%3Cimg%20src=%22data:image/svg+xml,%253Csvg%253E%253C/svg%253E%22%3E%3C/div%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<div><img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E"></div>',
          'decode');
      });

      it('should get sanitized value', () => {
        const xss = 'javascript:alert(1)';
        const data1 = `data:base64,${btoa(encodeURIComponent(xss))}`;
        const html1 = `<img src="${data1}">`;
        const data2 =
          `data:text/html;base64,${btoa(encodeURIComponent(html1))}`;
        const html2 = `<img src="${data2}">`;
        const data3 =
          `data:text/html;base64,${btoa(encodeURIComponent(html2))}`;
        const html3 = `<img src="${data3}">`;
        const url = `data:text/html;base64,${btoa(encodeURIComponent(html3))}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.replace(url);
        assert.strictEqual(res,
          'data:text/html,%3Cimg%20src=%22data:text/html,%253Cimg%2520src=%2522data:text/html,%25253Cimg%252520src=%252522%252522%25253E%2522%253E%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src="data:text/html,%3Cimg%20src=%22data:text/html,%253Cimg%2520src=%2522%2522%253E%22%3E">',
          'decode');
      });
    });

    describe('purify URL encoded DOM', () => {
      it('should throw', () => {
        const sanitizer = new URLSanitizer();
        assert.throws(() => sanitizer.purify(),
          'Expected String but got Undefined.');
      });

      it('should get value', () => {
        const data = '<script>alert(1)</script>';
        const encData = encodeURIComponent(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify(encData);
        assert.strictEqual(res, '', 'result');
      });

      it('should get value', () => {
        const data = '<div><script>alert(1)</script></div>';
        const encData = encodeURIComponent(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify(encData);
        assert.strictEqual(res, '%3Cdiv%3E%3C/div%3E', 'result');
      });

      it('should get value', async () => {
        const data =
          '<svg><g id="foo" onclick="alert(1)"><path/><path/></g></svg>';
        const encData = encodeURIComponent(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify(encData);
        assert.strictEqual(res, '%3Csvg%3E%3Cg%20id=%22foo%22%3E%3Cpath%3E%3C/path%3E%3Cpath%3E%3C/path%3E%3C/g%3E%3C/svg%3E',
          'result');
      });

      it('should get value', async () => {
        const data = '<img src="javascript:alert(1)">';
        const encData = encodeURIComponent(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify(encData);
        assert.strictEqual(res, '%3Cimg%3E', 'result');
        assert.strictEqual(decodeURIComponent(res), '<img>', 'decode');
      });

      it('should get value', async () => {
        const data = '<img src="data:,javascript:alert(1)">';
        const encData = encodeURIComponent(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify(encData);
        assert.strictEqual(res, '%3Cimg%20src=%22%22%3E', 'result');
        assert.strictEqual(decodeURIComponent(res), '<img src="">', 'decode');
      });

      it('should get value', async () => {
        const svg =
          '<svg><g id="foo" onclick="alert(1)"><path/><path/></g></svg>';
        const base64svg = btoa(svg);
        const data = `<img src="data:image/svg+xml;base64,${base64svg}">`;
        const encData = encodeURIComponent(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify(encData);
        assert.strictEqual(res,
          '%3Cimg%20src=%22data:image/svg+xml,%253Csvg%253E%253Cg%2520id=%2522foo%2522%253E%253Cpath%253E%253C/path%253E%253Cpath%253E%253C/path%253E%253C/g%253E%253C/svg%253E%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          '<img src="data:image/svg+xml,%3Csvg%3E%3Cg%20id=%22foo%22%3E%3Cpath%3E%3C/path%3E%3Cpath%3E%3C/path%3E%3C/g%3E%3C/svg%3E">',
          'decode');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify('data:,https://example.com/?foo=bar&baz=qux');
        assert.strictEqual(res, 'data:,https://example.com/?foo=bar&baz=qux',
          'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify('data:,https://example.com/?foo=bar&baz=<script>alert(1)</script>');
        assert.strictEqual(res, 'data:,https://example.com/?foo=bar&amp;baz=',
          'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.purify('data:,https://example.com/?<script>alert(1)</script>');
        assert.strictEqual(res, 'data:,https://example.com/',
          'result');
      });
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

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar');
        assert.strictEqual(res, 'web+foo:bar', 'result');
      });

      it('should get null if scheme is not registered', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo:bar');
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'https']
        });
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          only: ['Foo', 'https']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          allow: ['Foo']
        });
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

      it('should get null', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.isNull(res, 'result');
      });

      it('should get null even if blob scheme is in the allowed list', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['blob']
        });
        assert.isNull(res, 'result');
      });

      it('should get null even if blob scheme is in the only list', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          only: ['blob']
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
        const res = sanitizer.sanitize('http://example.com', {
          only: ['git', 'https']
        });
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', {
          only: ['git', 'https']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('git+https://example.com', {
          only: ['git', 'https']
        });
        assert.strictEqual(res, 'git+https://example.com', 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          only: ['Foo', 'git', 'https']
        });
        assert.isNull(res, 'result');
      });

      it('should override allow and get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data'],
          only: ['git', 'https']
        });
        assert.isNull(res, 'result');
      });

      it('should override deny and get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('https://example.com', {
          deny: ['https'],
          only: ['git', 'https']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
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
        assert.strictEqual(res, 'data:,Hello,%20World!', 'result');
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

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,https://example.com/#foo?', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,https://example.com/#foo?', 'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,https://example.com/#<script>alert(1);</script>', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,https://example.com/?<script>alert(1);</script>', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,https://example.com/?<script>alert(1);</script>#<script>alert(1)</script>', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:,https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const data = "<script>alert('XSS');</script><script>alert(1);</script>";
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize("data:text/html,%3Cscript%3Ealert('XSS');%3C/script%3E%3Cscript%3Ealert(1);%3C/script%3E", {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', () => {
        const data = "%3Cscript%3Ealert('XSS');%3C/script%3E%3Cscript%3Ealert(1);%3C/script%3E";
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', () => {
        const innerData = '<script>alert(1)</script>';
        const encodedInnerData = encodeURIComponent(innerData);
        const innerUrl = `data:text/html,${encodedInnerData}`;
        const data = `<img src="${innerUrl}">`;
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,<img src="">',
          'decode');
      });

      it('should get sanitized value', () => {
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
        assert.strictEqual(res, 'data:text/html,%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src="">', 'decode');
      });

      it('should get sanitized value', () => {
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
        assert.strictEqual(res,
          'data:text/html,%3Cimg%20src=%22%22%3E%3Cimg%20src=%22%22%3E%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src=""><img src=""><img src="">',
          'decode');
      });

      it('should get sanitized value', () => {
        const data = '<div><img src="data:image/svg+xml,<svg></svg>"></div>';
        const base64Data = btoa(data);
        const url = `data:text/html;base64,${base64Data}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res,
          'data:text/html,%3Cdiv%3E%3Cimg%20src=%22data:image/svg+xml,%253Csvg%253E%253C/svg%253E%22%3E%3C/div%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<div><img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E"></div>',
          'decode');
      });

      it('should get sanitized value', () => {
        const xss = 'javascript:alert(1)';
        const data1 = `data:base64,${btoa(encodeURIComponent(xss))}`;
        const html1 = `<img src="${data1}">`;
        const data2 =
          `data:text/html;base64,${btoa(encodeURIComponent(html1))}`;
        const html2 = `<img src="${data2}">`;
        const data3 =
          `data:text/html;base64,${btoa(encodeURIComponent(html2))}`;
        const html3 = `<img src="${data3}">`;
        const url = `data:text/html;base64,${btoa(encodeURIComponent(html3))}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res,
          'data:text/html,%3Cimg%20src=%22data:text/html,%253Cimg%2520src=%2522data:text/html,%25253Cimg%252520src=%252522%252522%25253E%2522%253E%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src="data:text/html,%3Cimg%20src=%22data:text/html,%253Cimg%2520src=%2522%2522%253E%22%3E">',
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
          const html = `<img src="${srcUrl}">`;
          const htmlBase64 = btoa(html);
          url = `data:text/html;base64,${htmlBase64}`;
        }
        const sanitizer = new URLSanitizer();
        assert.throws(() => sanitizer.sanitize(url, {
          allow: ['data']
        }), 'Data URLs nested too deeply.');
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
        const url = 'data:,javasc\u{0072}ipt:alert(1)';
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

      it('should get null', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const url = 'data:,&#xA0javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)?foo=bar&baz=qux';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', () => {
        const url = 'data:text/html,<img src="javascript:alert(1)">';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%3Cimg%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res), 'data:text/html,<img>',
          'decode');
      });

      it('should get sanitized value', () => {
        const xss = btoa('javascript:alert(1)');
        const url =
          `data:text/html,<img src="data:base64,${xss}">`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/html,%3Cimg%20src=%22%22%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:text/html,<img src="">', 'decode');
      });

      it('should get sanitized value', () => {
        const xss = '" onclick="alert(1)"';
        const url = `https://example.com/${xss}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const xss = '" onclick="alert(1)"';
        const url = `https://example.com/${encodeURIComponent(xss)}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const xss = '<script>alert(1)</script>';
        const url = `https://example.com/?${xss}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/?', 'result');
      });

      it('should get sanitized value', () => {
        const xss = '<script>alert(1)</script>';
        const url = `https://example.com/?${encodeURIComponent(xss)}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/?', 'result');
      });
    });

    describe('parse sanitized URL', () => {
      it('should throw', () => {
        const sanitizer = new URLSanitizer();
        assert.throws(() => sanitizer.parse(),
          'Expected String but got Undefined.');
      });

      it('should get result', () => {
        const sanitizer = new URLSanitizer();
        const url = 'javascript:alert(1)';
        const res = sanitizer.parse(url);
        assert.deepEqual(res, {
          input: 'javascript:alert(1)',
          valid: false
        }, 'result');
      });

      it('should get result', () => {
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });

      it('should get value', () => {
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });

      it('should get value', () => {
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });

      it('should get value', () => {
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });

      it('should get value', () => {
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });

      it('should get value', () => {
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
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
        const res = sanitizer.parse(url);
        assert.deepEqual(res, items, 'result');
      });
    });
  });

  describe('alias', () => {
    it('should get aliases', () => {
      assert.isTrue(typeof mjs.sanitizeURL === 'function');
      assert.isTrue(typeof mjs.sanitizeURLSync === 'function');
      assert.isTrue(typeof mjs.parseURL === 'function');
      assert.isTrue(typeof mjs.parseURLSync === 'function');
      assert.isTrue(typeof mjs.isURI === 'function');
      assert.isTrue(typeof mjs.isURISync === 'function');
    });

    describe('sanitize URL async', () => {
      const func = mjs.sanitizeURL;

      it('should get null', async () => {
        const res = await func();
        assert.isNull(res, 'result');
      });

      it('should get null', async () => {
        const res = await func('foo');
        assert.isNull(res, 'result');
      });

      it('should get null', async () => {
        const res = await func('javascript:alert(1)');
        assert.isNull(res, 'result');
      });

      it('should get value', async () => {
        const res = await func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get null', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = await func(url);
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.isNull(res, 'result');
      });

      it('should get null', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          deny: ['blob']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.isNull(res, 'result');
      });

      it('should get null', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          only: ['https']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.strictEqual(res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:image/svg+xml,<svg><g></g></svg>',
          'decoded');
      });

      it('should get null', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        URL.revokeObjectURL(url);
        const res = await func(url, {
          allow: ['blob']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.isNull(res, 'result');
      });

      it('should get sanitized value', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          deny: ['data']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.strictEqual(res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:image/svg+xml,<svg><g></g></svg>',
          'decoded');
      });

      it('should get sanitized value', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          only: ['blob', 'https']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.strictEqual(res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result');
        assert.strictEqual(decodeURIComponent(res),
          'data:image/svg+xml,<svg><g></g></svg>',
          'decoded');
      });

      it('should get sanitized value', async () => {
        const url = 'https://example.com/"quoted"';
        const res = await func(url, {
          allow: ['data', 'file'],
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', async () => {
        const url = "https://example.com/'quoted'";
        const res = await func(url, {
          allow: ['data', 'file'],
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', async () => {
        const url = 'https://example.com/?q="quoted"';
        const res = await func(url, {
          allow: ['data', 'file'],
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/?q=', 'result');
      });

      it('should get sanitized value', async () => {
        const url = "https://example.com/?q='quoted'";
        const res = await func(url, {
          allow: ['data', 'file'],
          remove: true
        });
        assert.strictEqual(res, 'https://example.com/?q=', 'result');
      });
    });

    describe('sanitize URL sync', () => {
      const func = mjs.sanitizeURLSync;

      it('should get null', () => {
        const res = func();
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const res = func('foo');
        assert.isNull(res, 'result');
      });

      it('should get null', () => {
        const res = func('javascript:alert(1)');
        assert.isNull(res, 'result');
      });

      it('should get value', () => {
        const res = func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get null', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = func(url, {
          allow: ['blob']
        });
        const revoked = await fetch(url).catch(e => {
          assert.instanceOf(e, Error, 'error');
          return (e instanceof Error);
        });
        assert.isTrue(revoked, 'revoked');
        assert.isNull(res, 'result');
      });
    });

    describe('parse URL async', () => {
      const func = mjs.parseURL;

      it('should get result', async () => {
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
    });

    describe('parse URL sync', () => {
      const func = mjs.parseURLSync;

      it('should get result', () => {
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

    describe('is URI async', () => {
      const func = mjs.isURI;

      it('should get value', async () => {
        const res = await func('https://example.com');
        assert.isTrue(res, 'result');
      });
    });

    describe('is URI sync', () => {
      const func = mjs.isURISync;

      it('should get value', () => {
        const res = func('https://example.com');
        assert.isTrue(res, 'result');
      });
    });
  });
});
