/**
 * sanitizer.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { isString } from '../scripts/common.js';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with {
  type: 'json'
};
import urlSanitizer, * as mjs from '../src/mjs/sanitizer.js';

describe('sanitizer', () => {
  describe('default', () => {
    it('should be instance of URLSanitizer', () => {
      assert.strictEqual(urlSanitizer instanceof mjs.URLSanitizer, true,
        'instance');
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

    it('should call console.warn with a message when isDebug is true', () => {
      logDebug(true, 'Test message');
      assert.strictEqual(warnStub.calledOnce, true,
        'console.warn should be called once');
      assert.strictEqual(
        warnStub.calledWith('[URLSanitizer Debug] Test message', ''),
        true,
        'should output message with an empty error string'
      );
    });

    it('should call console.warn with a message when error is provided', () => {
      const testError = new Error('Test error detail');
      logDebug(true, 'Test message', testError);
      assert.strictEqual(warnStub.calledOnce, true,
        'console.warn should be called once');
      assert.strictEqual(
        warnStub.calledWith(
          '[URLSanitizer Debug] Test message',
          'Test error detail'
        ),
        true,
        'should output message with the error.message'
      );
    });

    it('should not call console.warn when isDebug is false', () => {
      logDebug(false, 'Test message');
      assert.strictEqual(warnStub.called, false,
        'console.warn should not be called');
    });

    it('should not call console.warn when isDebug is false', () => {
      const testError = new Error('Test error detail');
      logDebug(false, 'Test message', testError);
      assert.strictEqual(warnStub.called, false,
        'console.warn should not be called');
    });
  });

  describe('URL sanitizer', () => {
    const { URLSanitizer } = mjs;

    it('should be instance of URLSanitizer', () => {
      const sanitizer = new URLSanitizer();
      assert.strictEqual(sanitizer instanceof URLSanitizer, true, 'instance');
    });

    describe('sanitize URL', () => {
      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize();
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo');
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('/../');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('javascript:alert("XSS")');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert("XSS")');
        assert.deepEqual(res, null, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar');
        assert.strictEqual(res, 'web+foo:bar', 'result');
      });

      it('should get null if scheme is not registered', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('foo:bar');
        assert.deepEqual(res, null, 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('bar');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(sanitizer.has('bar'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('foo');
        const res = sanitizer.sanitize('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(sanitizer.has('foo'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('bar');
        const res = sanitizer.sanitize('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(sanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(sanitizer.has('bar'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          only: ['Foo', 'https']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('Foo:bar', {
          allow: ['Foo']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null if file scheme is not explicitly allowed', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar');
        assert.deepEqual(res, null, 'result');
      });

      it('should override allow and get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('file:///foo/bar', {
          deny: ['file'],
          allow: ['file']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const blob = new Blob(['<script>alert(1)</script>'], {
          type: 'text/html'
        });
        const url = URL.createObjectURL(blob);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('http://example.com', {
          only: ['git', 'https']
        });
        assert.deepEqual(res, null, 'result');
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
        sanitizer.add('foo');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get value', () => {
        const sanitizer = new URLSanitizer();
        sanitizer.add('bar');
        const res = sanitizer.sanitize('foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.strictEqual(sanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(sanitizer.has('bar'), true, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+foo:bar', {
          only: ['foo', 'git', 'https']
        });
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
      });

      it('should override allow and get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data'],
          only: ['git', 'https']
        });
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)');
        assert.deepEqual(res, null, 'result');
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
        assert.strictEqual(res, 'http://example.com/', 'result');
        assert.deepEqual(Array.from(url.searchParams.entries()), [], 'search');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize("http://example.com/?foo=bar&<script>alert('XSS');</script>");
        const url = new URL(res);
        assert.strictEqual(res, 'http://example.com/?foo=bar', 'result');
        assert.deepEqual(Array.from(url.searchParams.entries()), [
          ['foo', 'bar']
        ], 'search');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res =
          sanitizer.sanitize('http://example.com/"onmouseover="alert(1)"');
        assert.strictEqual(res, 'http://example.com/', 'result');
      });

      it('should get null if data scheme is not explicitly allowed', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!');
        assert.deepEqual(res, null, 'result');
      });

      it('should override allow and get null', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:,Hello%2C%20World!', {
          allow: ['data'],
          deny: ['data']
        });
        assert.deepEqual(res, null, 'result');
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
        assert.deepEqual(res, null, 'result');
      });

      it('should get sanitized value', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize("data:text/html,%3Cscript%3Ealert('XSS');%3C/script%3E%3Cscript%3Ealert(1);%3C/script%3E", {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get sanitized value', () => {
        const data = "%3Cscript%3Ealert('XSS');%3C/script%3E%3Cscript%3Ealert(1);%3C/script%3E";
        const base64Data = btoa(data);
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(`data:text/html;base64,${base64Data}`, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
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
        }), Error, 'Data URLs nested too deeply.');
      });

      it('should get null', () => {
        const url = 'data:,javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,JAVASCRIPT:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc%72ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc\u0072ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc\u{0072}ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,\u2028javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,&#xA0javascript:alert(1)';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const url = 'data:,javasc&#x72;ipt:alert(1)?foo=bar&baz=qux';
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url, {
          allow: ['data']
        });
        assert.deepEqual(res, null, 'result');
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
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const xss = '" onclick="alert(1)"';
        const url = `https://example.com/${encodeURIComponent(xss)}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const xss = '<script>alert(1)</script>';
        const url = `https://example.com/?${xss}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', () => {
        const xss = '<script>alert(1)</script>';
        const url = `https://example.com/?${encodeURIComponent(xss)}`;
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize(url);
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should sanitize relative URLs when allowRelative is true', () => {
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

      it('should handle URIError in decodeURIComponent gracefully', () => {
        const sanitizer = new URLSanitizer();
        const res = sanitizer.sanitize('data:text/html,%', { allow: ['data'] });
        assert.strictEqual(res, 'data:text/html,%25', 'result');
      });

      it('should NOT log debug error when inner data is plain HTML', async () => {
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
          const hasParseError = warnStub.args.some(args =>
            args[0] &&
            args[0].includes('Failed to parse inner data URL protocol.')
          );
          assert.strictEqual(hasParseError, false,
            'Should not log parse error for plain HTML');
        } finally {
          warnStub.restore();
        }
      });

      it('should skip when circular Data URL is detected', () => {
        const warnStub = sinon.stub(console, 'warn');
        const originalHas = Set.prototype.has;
        const hasStub = sinon.stub(Set.prototype, 'has')
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
          assert.strictEqual(warnStub.called, true,
            'console.warn should be called');
          assert.strictEqual(
            warnStub.firstCall.args[0],
            '[URLSanitizer Debug] Circular Data URL detected and skipped: data:text/html,loop',
            'should output circular warning'
          );
          assert.strictEqual(res, 'data:text/html,%3Cimg%20src=%22%22%3E',
            'result');
        } finally {
          hasStub.restore();
          warnStub.restore();
        }
      });

      it('should return unencoded DOM if encodeURI throws URIError', () => {
        const encodeURIStub = sinon.stub(globalThis, 'encodeURI')
          .throws(new URIError('URI malformed'));
        try {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('data:text/html,<div>test</div>', {
            allow: ['data']
          });
          assert.strictEqual(res, 'data:text/html,<div>test</div>', 'result');
          assert.strictEqual(encodeURIStub.called, true, 'encodeURI should be called');
        } finally {
          encodeURIStub.restore();
        }
      });

      it('should catch and log debug message when relative URL parsing fails', () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const sanitizer = new mjs.URLSanitizer();
          const res = sanitizer.sanitize('http://[::1', {
            allowRelative: true,
            allow: ['http'],
            debug: true
          });
          assert.deepEqual(res, null, 'result should be null');
          assert.strictEqual(warnStub.calledOnce, true,
            'console.warn should be called once');
          assert.strictEqual(
            warnStub.firstCall.args[0],
            '[URLSanitizer Debug] Failed to parse relative URL.',
            'should output the correct debug message prefix'
          );
        } finally {
          warnStub.restore();
        }
      });

      describe('fast-path processing', () => {
        it('should use fast-path for HTTP(S) URLs', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('https://example.com/foo', {
            allow: ['data']
          });
          assert.strictEqual(res, 'https://example.com/foo', 'result');
        });

        it('should properly escape %26 within the fast-path', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('https://example.com/?foo=1%26bar=2', {
            allow: ['data']
          });
          assert.strictEqual(res, 'https://example.com/?foo=1%26amp;bar=2',
            'result');
        });

        it('should bypass fast-path if URL starts with "data:"', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('data:text/plain,test', {
            allow: ['data']
          });
          assert.strictEqual(
            res,
            'data:text/plain,test',
            'result'
          );
        });

        it('should bypass fast-path if URL contains "data:"', () => {
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

        it('should bypass fast-path', () => {
          const sanitizer = new URLSanitizer();
          const resDeny = sanitizer.sanitize('https://example.com/', {
            deny: ['file']
          });
          assert.strictEqual(resDeny, 'https://example.com/',
            'result with deny');
          const resOnly = sanitizer.sanitize('https://example.com/', {
            only: ['https', 'data']
          });
          assert.strictEqual(resOnly, 'https://example.com/',
            'result with only');
        });

        it('should catch and return null if new URL() throws', () => {
          const sanitizer = new URLSanitizer();
          const res = sanitizer.sanitize('http://[::1', {
            allow: ['data']
          });
          assert.deepEqual(res, null, 'result should be null');
        });
      });
    });

    describe('parse sanitized URL', () => {
      it('should throw', () => {
        const sanitizer = new URLSanitizer();
        assert.throws(() => sanitizer.parse(), TypeError,
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

    describe('add scheme', () => {
      it('should throw', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add(), TypeError,
          'Expected String but got Undefined.');
      });

      it('should throw', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add('javascript'), Error,
          'Invalid scheme: javascript');
      });

      it('should throw', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add('vbscript'), Error,
          'Invalid scheme: vbscript');
      });

      it('should throw', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add('web+javascript'), Error,
          'Invalid scheme: web+javascript');
      });

      it('should throw', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add('foo=bar'), Error,
          'Invalid scheme: foo=bar');
      });

      it('should add scheme', () => {
        const schemes = new URLSanitizer();
        const res = schemes.add('foo');
        assert.strictEqual(Array.isArray(res), true, 'result');
        assert.strictEqual(res.includes('foo'), true, 'added');
      });

      it('should add scheme', () => {
        const schemes = new URLSanitizer();
        const res = schemes.add('web+foo');
        assert.strictEqual(Array.isArray(res), true, 'result');
        assert.strictEqual(res.includes('web+foo'), true, 'added');
      });

      it('should throw if scheme contains script', () => {
        const schemes = new URLSanitizer();
        assert.throws(() => schemes.add('web+javascript'), Error,
          'Invalid scheme: web+javascript');
        assert.throws(() => schemes.add('ext+vbscript'), Error,
          'Invalid scheme: ext+vbscript');
      });
    });

    describe('remove scheme', () => {
      it('should get false', () => {
        const schemes = new URLSanitizer();
        const res = schemes.remove('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('should get true', () => {
        const schemes = new URLSanitizer();
        schemes.add('foo');
        const res = schemes.remove('foo');
        assert.strictEqual(res, true, 'result');
      });
    });

    describe('reset sanitizer', () => {
      it('should reset', () => {
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
    it('should get aliases', () => {
      assert.strictEqual(typeof mjs.sanitizeURL, 'function');
      assert.strictEqual(typeof mjs.sanitizeURLSync, 'function');
      assert.strictEqual(typeof mjs.parseURL, 'function');
      assert.strictEqual(typeof mjs.parseURLSync, 'function');
      assert.strictEqual(typeof mjs.isURI, 'function');
      assert.strictEqual(typeof mjs.isURISync, 'function');
    });

    describe('sanitize URL async', () => {
      const func = mjs.sanitizeURL;

      it('should get null', async () => {
        const res = await func();
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', async () => {
        const res = await func('foo');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', async () => {
        const res = await func('javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('should get value', async () => {
        const res = await func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get value', async () => {
        const res = await func('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(urlSanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get null and NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url);
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null and NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          deny: ['blob']
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null and NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          only: ['https']
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(isRevoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should get sanitized value and NOT revoke blob', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob']
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
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

      it('should get null if URL is already manually revoked', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        URL.revokeObjectURL(url); // 事前に手動で破棄
        const res = await func(url, {
          allow: ['blob']
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(isRevoked, true, 'revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should get sanitized value and NOT revoke blob', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          deny: ['data']
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
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

      it('should get sanitized value and NOT revoke blob', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          only: ['blob', 'https']
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
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

      it('should get sanitized value AND revoke blob', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          allow: ['blob'],
          revokeObjectURL: true
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(isRevoked, true, 'should be revoked');
        assert.strictEqual(
          res,
          'data:image/svg+xml,%3Csvg%3E%3Cg%3E%3C/g%3E%3C/svg%3E',
          'result'
        );
      });

      it('should get null AND revoke blob', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await func(url, {
          revokeObjectURL: true
        });
        const isRevoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(isRevoked, true, 'should be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should get sanitized value', async () => {
        const url = 'https://example.com/"quoted"';
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', async () => {
        const url = "https://example.com/'quoted'";
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get sanitized value', async () => {
        const url = 'https://example.com/?q="quoted"';
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/?q=', 'result');
      });

      it('should get sanitized value', async () => {
        const url = "https://example.com/?q='quoted'";
        const res = await func(url, {
          allow: ['data', 'file']
        });
        assert.strictEqual(res, 'https://example.com/?q=', 'result');
      });

      it('should add scheme to options.only list', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = { only: ['blob', 'https'] };
        const res = await func(url, opt);
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

      it('should keep scheme in options.only list', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = { only: ['blob', 'data', 'https'] };
        const res = await func(url, opt);
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

      it('should add to options.allow / remove from options.deny', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = {
          allow: ['blob', 'http'],
          deny: ['data', 'ftp']
        };
        const res = await func(url, opt);
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

      it('should keep scheme in options.allow', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const opt = { allow: ['blob', 'data'] };
        const res = await func(url, opt);
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

      it('should silently catch and return', () => {
        const OriginalURL = globalThis.URL;
        let isCatchHit = false;
        globalThis.URL = class extends OriginalURL {
          constructor(url, base) {
            if (url === 'data:text/html,error-trigger') {
              isCatchHit = true;
              throw new TypeError('Simulated URL parsing error');
            }
            super(url, base);
          }
        };
        try {
          const sanitizer = new mjs.URLSanitizer();
          const innerHtml = '<a href="data:text/html,error-trigger">link</a>';
          const base64Data = btoa(innerHtml);
          const url = `data:text/html;base64,${base64Data}`;
          const res = sanitizer.sanitize(url, { allow: ['data'] });
          assert.strictEqual(isCatchHit, true,
            'catch block should be executed');
          assert.strictEqual(typeof res, 'string',
            'should safely return sanitized string');
        } finally {
          globalThis.URL = OriginalURL;
        }
      });
    });

    describe('sanitize URL sync', () => {
      const func = mjs.sanitizeURLSync;

      it('should get null', () => {
        const res = func();
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const res = func('foo');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null', () => {
        const res = func('javascript:alert(1)');
        assert.deepEqual(res, null, 'result');
      });

      it('should get value', () => {
        const res = func('https://example.com');
        assert.strictEqual(res, 'https://example.com/', 'result');
      });

      it('should get value', () => {
        const res = func('foo:bar', {
          allow: ['foo']
        });
        assert.strictEqual(urlSanitizer.has('foo'), false, 'scheme');
        assert.strictEqual(res, 'foo:bar', 'result');
      });

      it('should get null and NOT revoke blob by default', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = func(url, {
          allow: ['blob']
        });
        const revoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(revoked, false, 'should not be revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should get null AND revoke blob', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], {
          type: 'image/svg+xml'
        });
        const url = URL.createObjectURL(blob);
        const res = func(url, {
          allow: ['blob'],
          revokeObjectURL: true
        });
        const revoked = await fetch(url).then(() => false).catch(() => true);
        assert.strictEqual(revoked, true, 'revoked');
        assert.deepEqual(res, null, 'result');
      });

      it('should log debug message for invalid URL when debug is true', () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const invalidUrl = 'invalid-url-string';
          const res = func(invalidUrl, { debug: true });
          assert.deepEqual(res, null, 'result should be null');
          assert.strictEqual(warnStub.calledOnce, true,
            'console.warn should be called once');
          const expectedPrefix =
            `[URLSanitizer Debug] Invalid URL input format: ${invalidUrl}`;
          assert.strictEqual(warnStub.firstCall.args[0], expectedPrefix,
            'should output the correct debug message');
          assert.strictEqual(isString(warnStub.firstCall.args[1]), true,
            'should output the error message');
        } finally {
          warnStub.restore();
        }
      });

      it('should NOT log debug message for invalid URL when debug is false', () => {
        const warnStub = sinon.stub(console, 'warn');
        try {
          const invalidUrl = 'invalid-url-string';
          const res = func(invalidUrl, { debug: false });
          assert.deepEqual(res, null, 'result should be null');
          assert.strictEqual(warnStub.called, false,
            'console.warn should not be called');
        } finally {
          warnStub.restore();
        }
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
        assert.strictEqual(res, true, 'result');
      });
    });

    describe('is URI sync', () => {
      const func = mjs.isURISync;

      it('should get value', () => {
        const res = func('https://example.com');
        assert.strictEqual(res, true, 'result');
      });
    });
  });
});
