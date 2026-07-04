/**
 * uri-util.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';

/* test */
import uriSchemes from '../src/lib/iana/uri-schemes.json' with { type: 'json' };
import * as mjs from '../src/mjs/uri-util.js';

describe('uri-util', () => {
  describe('get URL encoded string', () => {
    const func = mjs.getURLEncodedString;

    it('should throw', () => {
      assert.throws(
        () => func(),
        TypeError,
        'Expected String but got Undefined.'
      );
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
      assert.strictEqual(res, undefined, 'result');
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
      assert.throws(
        () => func(),
        TypeError,
        'Expected String but got Undefined.'
      );
    });

    it('should throw', () => {
      assert.throws(
        () => func('foo%20bar'),
        Error,
        'Invalid base64 data: foo%20bar'
      );
    });

    it('should get data', () => {
      const data =
        'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = func(data);
      assert.strictEqual(res, data, 'result');
    });

    it('should get parsed data', () => {
      const data = 'Hello%2C%20World!';
      const base64Data = btoa(data);
      const res = func(base64Data);
      assert.strictEqual(res, data, 'result');
    });

    it('should return original base64 if it contains control characters', () => {
      const binaryText = 'Hello\x00World';
      const base64Data = btoa(binaryText); // "SGVsbG8AV29ybGQ="
      const res = func(base64Data);
      assert.strictEqual(res, base64Data, 'result');
    });

    it('should NOT return original base64 if it only contains valid text control characters', () => {
      const validText = 'Hello\tWorld\n';
      const base64Data = btoa(validText);
      const res = func(base64Data);
      assert.strictEqual(res, validText, 'result');
    });

    describe('environment specific decoding optimizations', () => {
      it('should decode base64 using Buffer', () => {
        assert.ok(
          globalThis.Buffer,
          'Buffer should be available in this environment'
        );
        const data = 'Hello, Node.js Buffer optimization!';
        const base64Data = btoa(data);
        const res = func(base64Data);
        assert.strictEqual(res, data, 'result');
      });

      it('should decode base64 using Uint8Array fallback', () => {
        const originalBuffer = globalThis.Buffer;
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        try {
          assert.strictEqual(
            globalThis.Buffer,
            undefined,
            'Buffer should be hidden'
          );
          const data = 'Hello, Uint8Array loop optimization!';
          const base64Data = btoa(data);
          const res = func(base64Data);
          assert.strictEqual(res, data, 'result');
        } finally {
          Object.defineProperty(globalThis, 'Buffer', {
            value: originalBuffer,
            writable: true,
            configurable: true
          });
        }
      });
    });
  });

  describe('replace numeric character reference', () => {
    const func = mjs.replaceNumCharRef;

    it('should replace decimal text char', () => {
      // 44 is ','
      const res = func('&#44;', '44');
      assert.strictEqual(res, ',', 'result');
    });

    it('should replace hex text char', () => {
      // 0x2C is ','
      const res = func('&#x2C;', 'x2C');
      assert.strictEqual(res, ',', 'result');
    });

    it('should replace uppercase hex text char', () => {
      // 0x6F is 'o'
      const res = func('&#X006F;', 'X006F');
      assert.strictEqual(res, 'o', 'result');
    });

    it('should strip decimal non-text char under 256', () => {
      // 0 is NULL
      const res = func('&#0;', '0');
      assert.strictEqual(res, '', 'result');
    });

    it('should strip hex non-text char under 256', () => {
      // 0x01 is SOH (Start of Heading), a non-text control character
      const res = func('&#x01;', 'x01');
      assert.strictEqual(res, '', 'result');
    });

    it('should return original match for out-of-range values', () => {
      // 9829 is out of 0x00-0xFF range and not in text chars
      const res = func('&#9829;', '9829');
      assert.strictEqual(res, '&#9829;', 'result');
    });

    it('should return original match for invalid values', () => {
      const res = func('&#foo;', 'foo');
      assert.strictEqual(res, '&#foo;', 'result');
    });

    it('should return original match for invalid hex values', () => {
      const res = func('&#xZZ;', 'xZZ');
      assert.strictEqual(res, '&#xZZ;', 'result');
    });

    it('should replace Windows-1252 decimal reference with mapped Unicode char', () => {
      const res = func('&#128;', '128');
      assert.strictEqual(res, '\u20AC', 'result');
    });

    it('should replace Windows-1252 hex reference with mapped Unicode char', () => {
      const res = func('&#x99;', 'x99');
      assert.strictEqual(res, '\u2122', 'result');
    });
  });

  describe('parse URL encoded numeric character reference', () => {
    const func = mjs.parseURLEncodedNumCharRef;

    it('should throw', () => {
      assert.throws(
        () => func(),
        TypeError,
        'Expected String but got Undefined.'
      );
    });

    it('should throw', () => {
      const str = 'Hello%2C%20World!';
      assert.throws(
        () => func(str, true),
        TypeError,
        'Expected Number but got Boolean.'
      );
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
      assert.throws(
        () => func(str),
        Error,
        'Character references nested too deeply.'
      );
    });

    it('should fallback to partial decoding', () => {
      const str = 'Hello%2C%20World!%';
      const res = func(str);
      assert.strictEqual(res, 'Hello, World!%', 'result');
    });

    it('should fallback and leave invalid multi-byte sequences intact', () => {
      const str = 'Hello%E0%A4-%20World!';
      const res = func(str);
      assert.strictEqual(res, 'Hello%E0%A4- World!', 'result');
    });

    it('should successfully resolve entities', () => {
      const str = 'j%26%23x61%3Bvascript:%';
      const res = func(str);
      assert.strictEqual(res, 'javascript:%', 'result');
    });
  });

  describe('convert blob to data URL', () => {
    const func = mjs.convertBlobToDataURL;

    it('should get null', async () => {
      const res = await func();
      assert.deepEqual(res, null, 'result');
    });

    it('should get null', async () => {
      const res = await func('');
      assert.deepEqual(res, null, 'result');
    });

    it('should get null', async () => {
      const res = await func('https://example.com');
      assert.deepEqual(res, null, 'result');
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
      assert.deepEqual(res, null, 'result');
    });

    it('should reject if blob size exceeds maxSize', async () => {
      const data = 'a'.repeat(100);
      const blob = new Blob([data], { type: 'text/plain' });
      const maxSize = 50;
      await assert.rejects(
        async () => {
          await func(blob, maxSize);
        },
        err => {
          assert.strictEqual(err.name, 'NotReadableError', 'error name');
          assert.strictEqual(
            err.message,
            `Blob size (${blob.size} bytes) exceeds max (${maxSize} bytes).`,
            'error message'
          );
          return true;
        }
      );
    });

    it('should convert blob to data URL using Buffer', async () => {
      assert.ok(
        globalThis.Buffer,
        'Buffer should be available in this environment'
      );
      const data = 'Hello, Node.js Buffer!';
      const blob = new Blob([data], {
        type: 'text/plain'
      });
      const base64 = globalThis.Buffer.from(data).toString('base64');
      const url = `data:text/plain;base64,${base64}`;
      const res = await func(blob);
      assert.strictEqual(res, url, 'result using convertFromBuffer');
    });

    it('should handle blob without type using Buffer', async () => {
      assert.ok(
        globalThis.Buffer,
        'Buffer should be available in this environment'
      );
      const data = 'No MIME type text';
      const blob = new Blob([data]);
      const base64 = globalThis.Buffer.from(data).toString('base64');
      const url = `data:base64,${base64}`;
      const res = await func(blob);
      assert.strictEqual(res, url, 'result without MIME type');
    });

    describe('convert blob to data URL via FileReader path', () => {
      let originalBuffer;
      let originalFileReader;

      beforeEach(() => {
        originalBuffer = globalThis.Buffer;
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        originalFileReader = globalThis.FileReader;
      });

      afterEach(() => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: originalBuffer,
          writable: true,
          configurable: true
        });
        globalThis.FileReader = originalFileReader;
      });

      it('should convert blob to data URL using FileReader', async () => {
        const sampleDataURL =
          'data:text/html;base64,PHA+SGVsbG8sIHdvcmxkITwvcD4=';
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL(blob) {
            setTimeout(() => {
              this.result = sampleDataURL;
              if (this.listeners.load) {
                this.listeners.load();
              }
            }, 0);
          }
        };
        const blob = new Blob(['<p>Hello, world!</p>'], { type: 'text/html' });
        const res = await func(blob);
        assert.strictEqual(res, sampleDataURL, 'should return data URL');
      });

      it('should reject when FileReader throws an error', async () => {
        const mockError = new Error('Mock FileReader Read Error');
        globalThis.FileReader = class {
          constructor() {
            this.listeners = {};
            this.error = mockError;
          }

          addEventListener(type, callback) {
            this.listeners[type] = callback;
          }

          readAsDataURL(blob) {
            setTimeout(() => {
              if (this.listeners.error) {
                this.listeners.error();
              }
            }, 0);
          }
        };
        const blob = new Blob(['test'], { type: 'text/plain' });
        await assert.rejects(
          async () => {
            await func(blob);
          },
          err => {
            assert.strictEqual(err.message, 'Mock FileReader Read Error');
            return true;
          },
          'should reject with error'
        );
      });
    });

    describe('convert blob to data URL via btoa path', () => {
      let originalBuffer;
      let originalFileReader;

      beforeEach(() => {
        originalBuffer = globalThis.Buffer;
        originalFileReader = globalThis.FileReader;
        Object.defineProperty(globalThis, 'Buffer', {
          value: undefined,
          writable: true,
          configurable: true
        });
        Object.defineProperty(globalThis, 'FileReader', {
          value: undefined,
          writable: true,
          configurable: true
        });
      });

      afterEach(() => {
        Object.defineProperty(globalThis, 'Buffer', {
          value: originalBuffer,
          writable: true,
          configurable: true
        });
        Object.defineProperty(globalThis, 'FileReader', {
          value: originalFileReader,
          writable: true,
          configurable: true
        });
      });

      it('should convert blob to data URL using btoa', async () => {
        assert.strictEqual(
          globalThis.Buffer,
          undefined,
          'Buffer should be hidden'
        );
        assert.strictEqual(
          globalThis.FileReader,
          undefined,
          'FileReader should be hidden'
        );
        const data = 'Hello, btoa fallback!';
        const blob = new Blob([data], {
          type: 'text/plain'
        });
        const base64 = btoa(data);
        const url = `data:text/plain;base64,${base64}`;
        const res = await func(blob);
        assert.strictEqual(res, url, 'result');
      });

      it('should handle blob without type using btoa', async () => {
        const data = 'No MIME type text for btoa';
        const blob = new Blob([data]);
        const base64 = btoa(data);
        const url = `data:base64,${base64}`;
        const res = await func(blob);
        assert.strictEqual(res, url, 'result without MIME type');
      });
    });
  });

  describe('Trim trailing empty query and hash', () => {
    const func = mjs.trimTrailingEmptyQueryAndHash;

    it('should remove a trailing empty hash', () => {
      assert.strictEqual(
        func('https://example.com#'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%23'),
        'https://example.com',
        'result'
      );
    });

    it('should remove a trailing empty query', () => {
      assert.strictEqual(
        func('https://example.com?'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%3F'),
        'https://example.com',
        'result'
      );
    });

    it('should remove a trailing empty query followed by an empty hash', () => {
      assert.strictEqual(
        func('https://example.com?#'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%3F%23'),
        'https://example.com',
        'result'
      );
    });

    it('should intentionally preserve a question mark inside a hash fragment', () => {
      assert.strictEqual(
        func('https://example.com#section?'),
        'https://example.com#section?',
        'result'
      );
      assert.strictEqual(
        func('https://example.com%23section%3F'),
        'https://example.com%23section%3F',
        'result'
      );
      assert.strictEqual(
        func('https://example.com#?'),
        'https://example.com#?',
        'result'
      );
    });

    it('should return the original string if no trailing empty hash or query exists', () => {
      assert.strictEqual(
        func('https://example.com'),
        'https://example.com',
        'result'
      );
      assert.strictEqual(
        func('data:text/html,<div>'),
        'data:text/html,<div>',
        'result'
      );
    });

    it('should return the input as is if it is not a string', () => {
      assert.strictEqual(func(null), null, 'result');
      assert.strictEqual(func(undefined), undefined, 'result');
      assert.strictEqual(func(123), 123, 'result');
    });
  });

  describe('URI schemes', () => {
    const { URISchemes } = mjs;

    it('should create instance', () => {
      const schemes = new URISchemes();
      assert.strictEqual(schemes instanceof URISchemes, true, 'instance');
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
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.has('moz-extension');
        assert.strictEqual(res, true, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.has('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.has('web+foo');
        assert.strictEqual(res, false, 'result');
      });
    });

    describe('is URI', () => {
      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify();
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo:bar');
        assert.strictEqual(res, false, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo:bar', new Set(['foo']));
        assert.strictEqual(res, true, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('Javas&#99;ript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('/../');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('../../');
        assert.strictEqual(res, false, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(' https://example.com ');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com:8000/#foo?bar=baz');
        assert.strictEqual(res, true, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://example.com foo');
        assert.strictEqual(res, false, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://127.0.0.1');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('https://[::1]/');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('file:///C:/Users/Foo/');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('mailto:foo@example.com');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+foo://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+foo://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(
          'ext+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify(
          'web+vbscript:window.external.AddFavorite(&quot;http://www.mozilla.org/&quot;,&quot;Mozilla&quot;)'
        );
        assert.strictEqual(res, false, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('git+https://example.com/');
        assert.strictEqual(res, true, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('foo+https://example.com/');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('git+foo://example.com/');
        assert.strictEqual(res, false, 'result');
      });

      it('should get true', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('URN:ISBN:4-8399-0454-5');
        assert.strictEqual(res, true, 'result');
      });

      it('should get false for scheme containing script', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+javascript:alert(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get false for scheme containing script', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('ext+vbscript:msgbox(1)');
        assert.strictEqual(res, false, 'result');
      });

      it('should get true for valid ext scheme', () => {
        const schemes = new URISchemes();
        const res = schemes.verify('web+foo:bar');
        assert.strictEqual(res, true, 'result');
      });

      it('should verify using custom schemes set', () => {
        const schemes = new URISchemes();
        const customSchemes = new Set(['foo', 'bar']);
        assert.strictEqual(schemes.verify('foo:test'), false, 'default false');
        assert.strictEqual(
          schemes.verify('foo:test', customSchemes),
          true,
          'custom true'
        );
        assert.strictEqual(
          schemes.verify('baz:test', customSchemes),
          false,
          'custom false'
        );
      });
    });
  });
});
