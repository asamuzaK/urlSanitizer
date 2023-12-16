/**
 * uri-util.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with { type: 'json' };
import * as mjs from '../src/mjs/uri-util.js';

describe('uri-util', () => {
  describe('get URL encoded string', () => {
    const func = mjs.getURLEncodedString;

    it('should throw', () => {
      assert.throws(() => func(), 'Expected String but got Undefined.');
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
    const func = mjs.escapeURLEncodedHTMLChars;

    it('should get undefined', () => {
      const res = func();
      assert.isUndefined(res, 'result');
    });

    it('should get value', () => {
      const res = func('foo');
      assert.strictEqual(res, 'foo', 'result');
    });

    it('should get value', () => {
      const res = func('%3g');
      assert.strictEqual(res, '%3g', 'result');
    });

    it('should get value', () => {
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

  describe('parse base64 encoded data', () => {
    const func = mjs.parseBase64;

    it('should throw', () => {
      assert.throws(() => func(), 'Expected String but got Undefined.');
    });

    it('should throw', () => {
      assert.throws(() => func('foo%20bar'), 'Invalid base64 data: foo%20bar');
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
    const func = mjs.parseURLEncodedNumCharRef;

    it('should throw', () => {
      assert.throws(() => func(), 'Expected String but got Undefined.');
    });

    it('should throw', () => {
      const str = 'Hello%2C%20World!';
      assert.throws(() => func(str, true), 'Expected Number but got Boolean.');
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
      const heart = '&#9829;';
      const str = `He${l}${l}o${comma}%20${nul}W${o}r${l}d${heart}`;
      const res = func(str);
      assert.strictEqual(res, `Hello, World${heart}`, 'result');
    });

    it('should get value', () => {
      const amp = '&#x26;';
      const semi = '&#x3B;';
      let nest = amp;
      for (let i = 0; i < 15; i++) {
        nest = `${nest}#x26;`;
      }
      const str = `j${nest}#x61${semi}vascript:alert(1)`;
      const res = func(str);
      assert.strictEqual(res, 'javascript:alert(1)', 'result');
    });

    it('should throw', () => {
      const amp = '&#x26;';
      const semi = '&#x3B;';
      let nest = amp;
      for (let i = 0; i < 16; i++) {
        nest = `${nest}#x26;`;
      }
      const str = `j${nest}#x61${semi}vascript:alert(1)`;
      assert.throws(() => func(str), 'Character references nested too deeply.');
    });
  });

  describe('create data URL from blob', () => {
    const func = mjs.createDataURLFromBlob;

    it('should get null', async () => {
      const res = await func();
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func('');
      assert.isNull(res, 'result');
    });

    it('should get null', async () => {
      const res = await func('https://example.com');
      assert.isNull(res, 'result');
    });

    it('should get result', async () => {
      const data = '<p>Hello, world!</p>';
      const base64Data = btoa(data);
      const blob = new Blob([data], {
        type: 'text/html'
      });
      const res = await func(blob);
      assert.strictEqual(res, `data:text/html;base64,${base64Data}`, 'result');
    });

    it('should get null', async () => {
      const data = '<p>Hello, world!</p>';
      const blob = new Blob([data], {
        type: 'text/html'
      });
      const url = URL.createObjectURL(blob);
      const res = await func(url);
      assert.isNull(res, 'result');
    });
  });

  describe('URI schemes', () => {
    const { URISchemes } = mjs;

    it('should create instance', () => {
      const schemes = new URISchemes();
      assert.instanceOf(schemes, URISchemes, 'instance');
    });

    describe('get schemes', () => {
      it('should get schemes', () => {
        const schemes = new URISchemes();
        const res = schemes.get();
        assert.deepEqual(res, uriSchemes, 'result');
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
        const res = schemes.verify();
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo:bar');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        schemes.add('foo');
        const res = schemes.verify('foo:bar');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('javascript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('Javas&#99;ript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('/../');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('../../');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(' https://example.com ');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com:8000/#foo?bar=baz');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com foo');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://127.0.0.1');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://[::1]/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('file:///C:/Users/Foo/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('mailto:foo@example.com');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+foo://example.com/');
        assert.isTrue(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+foo://example.com/');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+javascript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('git+https://example.com/');
        assert.isTrue(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo+https://example.com/');
        assert.isFalse(res, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('git+foo://example.com/');
        assert.isFalse(res, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('URN:ISBN:4-8399-0454-5');
        assert.isTrue(res, 'result');
      });
    });

    describe('reset schemes', () => {
      it('should reset', () => {
        const schemes = new URISchemes();
        schemes.remove('http');
        schemes.reset();
        const res = schemes.get();
        assert.isTrue(schemes.has('http'), 'scheme');
        assert.deepEqual(res, uriSchemes, 'result');
      });
    });
  });
});
