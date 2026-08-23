export const runSharedTests = (context, assert, options = {}) => {
  const {
    afterEach,
    describe,
    it,
    urlSanitizer,
    sanitizeURL,
    sanitizeURLSync,
    inspectURL,
    isValidURI
  } = context;

  const { woDomPurify = false } = options;

  describe('urlSanitizer', () => {
    it('should expose required methods', () => {
      assert.strictEqual(typeof urlSanitizer.get, 'function', 'get');
      assert.strictEqual(typeof urlSanitizer.has, 'function', 'has');
      assert.strictEqual(typeof urlSanitizer.add, 'function', 'add');
      assert.strictEqual(typeof urlSanitizer.remove, 'function', 'remove');
    });

    describe('get', () => {
      it('should return an array of schemes', () => {
        const schemes = urlSanitizer.get();
        assert.strictEqual(Array.isArray(schemes), true, 'result');
      });
    });

    describe('has', () => {
      it('should return true for existing scheme', () => {
        const res = urlSanitizer.has('https');
        assert.strictEqual(res, true, 'result');
      });

      it('should return false for missing scheme', () => {
        const res = urlSanitizer.has('foo');
        assert.strictEqual(res, false, 'result');
      });
    });

    describe('add', () => {
      it('should add a new scheme successfully', () => {
        assert.strictEqual(urlSanitizer.has('foo'), false);
        const res = urlSanitizer.add('foo');
        assert.strictEqual(urlSanitizer.has('foo'), true);
        assert.strictEqual(Array.isArray(res), true, 'result');
        urlSanitizer.remove('foo');
      });

      it('should throw when trying to add javascript', () => {
        assert.throws(() => urlSanitizer.add('javascript'), {
          name: 'Error',
          message: 'Invalid scheme: javascript'
        });
      });

      it('should throw when trying to add vbscript', () => {
        assert.throws(() => urlSanitizer.add('vbscript'), {
          name: 'Error',
          message: 'Invalid scheme: vbscript'
        });
      });
    });

    describe('remove', () => {
      it('should remove existing scheme and return true', () => {
        assert.strictEqual(urlSanitizer.has('aaa'), true);
        const res = urlSanitizer.remove('aaa');
        assert.strictEqual(urlSanitizer.has('aaa'), false);
        assert.strictEqual(res, true, 'result');
        urlSanitizer.add('aaa');
      });

      it('should return false when removing missing scheme', () => {
        assert.strictEqual(urlSanitizer.has('foo'), false);
        const res = urlSanitizer.remove('foo');
        assert.strictEqual(res, false, 'result');
      });
    });
  });

  describe('sanitize URL', () => {
    afterEach(() => {
      urlSanitizer.reset();
    });

    it('should get null for javascript: scheme', async () => {
      const url = 'javascript:alert(1)';
      const res = await sanitizeURL(url);
      assert.strictEqual(res, null, 'result');
    });

    it('should get null for javascript: scheme even if allowed', async () => {
      const url = 'javascript:alert(1)';
      const res = await sanitizeURL(url, {
        allow: ['javascript']
      });
      assert.strictEqual(res, null, 'result');
    });

    it('should sanitize XSS from standard HTTP URL', async () => {
      const url =
        'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = await sanitizeURL(url);
      assert.strictEqual(res, 'http://example.com/', 'result');
    });

    it('should return null for denied custom scheme', async () => {
      const res = await sanitizeURL('web+foo://example.com', {
        deny: ['web+foo']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should return null for scheme not in only list', async () => {
      const res = await sanitizeURL('http://example.com', {
        only: ['data', 'git', 'https']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should sanitize URL allowed by only list', async () => {
      const url = 'https://example.com/"onmouseover="alert(1)"';
      const res = await sanitizeURL(url, { only: ['data', 'git', 'https'] });
      assert.strictEqual(res, 'https://example.com/', 'result');
    });

    it('should return null for custom scheme with XSS', async () => {
      const url = 'git+https://example.com/foo.git?<script>alert(1)</script>';
      const res = await sanitizeURL(url, { only: ['data', 'git', 'https'] });
      assert.strictEqual(res, null, 'result');
    });

    it('should return null for HTML entity obfuscation', async () => {
      const url = 'javascript&colon;alert(1)';
      const res = await sanitizeURL(url);
      assert.deepEqual(res, null, 'result');
    });

    it('should return null for tab obfuscated scheme', async () => {
      const url = 'javasc&Tab;ript:alert(1);';
      const res = await sanitizeURL(url);
      assert.deepEqual(res, null, 'result');
    });

    it('should return false after scheme has been removed', async () => {
      const url = 'http://example.com';
      const res1 = await sanitizeURL(url);
      assert.strictEqual(res1, 'http://example.com/', 'should get url');
      urlSanitizer.remove('http');
      assert.strictEqual(
        urlSanitizer.has('http'),
        false,
        'should remove scheme'
      );
      const res2 = await sanitizeURL(url);
      assert.strictEqual(res2, null, 'should return null after removal');
    });

    if (woDomPurify) {
      it('should throw on data URL without DOMPurify', async () => {
        const data =
          '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
        const url = `data:text/html,${encodeURIComponent(data)}`;
        let err;
        const res = await sanitizeURL(url, { allow: ['data'] }).catch(e => {
          err = e;
        });
        assert.strictEqual(err instanceof Error, true);
        assert.strictEqual(res, undefined);
      });

      it('should throw on base64 data URL without DOMPurify', async () => {
        const base64data = btoa('<div><script>alert(1);</script></div>');
        const url = `data:text/html;base64,${base64data}`;
        let err;
        const res = await sanitizeURL(url, { allow: ['data'] }).catch(e => {
          err = e;
        });
        assert.strictEqual(err instanceof Error, true);
        assert.strictEqual(res, undefined);
      });

      it('should throw on base64 img URL without DOMPurify', async () => {
        const base64data = btoa('<div><img src="javascript:alert(1)"></div>');
        const url = `data:text/html;base64,${base64data}`;
        let err;
        const res = await sanitizeURL(url, { allow: ['data'] }).catch(e => {
          err = e;
        });
        assert.strictEqual(err instanceof Error, true);
        assert.strictEqual(res, undefined);
      });

      it('should throw on blob URL without DOMPurify', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        let err;
        const res = await sanitizeURL(url, { allow: ['blob'] }).catch(e => {
          err = e;
        });
        URL.revokeObjectURL(url);
        assert.strictEqual(err instanceof Error, true);
        assert.strictEqual(res, undefined);
      });
    } else {
      it('should sanitize XSS from data:text/html URL', async () => {
        const data =
          '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
        const url = `data:text/html,${encodeURIComponent(data)}`;
        const res = await sanitizeURL(url, { allow: ['data'] });
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

      it('should sanitize XSS from base64 data:text/html', async () => {
        const base64data = btoa('<div><script>alert(1);</script></div>');
        const url = `data:text/html;base64,${base64data}`;
        const res = await sanitizeURL(url, { allow: ['data'] });
        assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3C/div%3E', 'result');
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<div></div>',
          'decode'
        );
      });

      it('should sanitize javascript: img from base64 data', async () => {
        const base64data = btoa('<div><img src="javascript:alert(1)"></div>');
        const url = `data:text/html;base64,${base64data}`;
        const res = await sanitizeURL(url, { allow: ['data'] });
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

      it('should sanitize XSS from blob URL containing SVG', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = await sanitizeURL(url, { allow: ['blob'] });
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
    }
  });

  describe('sanitize URL sync', () => {
    it('should sanitize XSS from standard HTTP URL', () => {
      const url =
        'http://example.com/"onmouseover="alert(1)"?<script>alert(\'XSS\');</script>';
      const res = sanitizeURLSync(url);
      assert.strictEqual(res, 'http://example.com/', 'result');
    });

    it('should return null for denied custom scheme', () => {
      const res = sanitizeURLSync('web+foo://example.com', {
        deny: ['web+foo']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should return null for scheme not in only list', () => {
      const res = sanitizeURLSync('http://example.com', {
        only: ['data', 'git', 'https']
      });
      assert.deepEqual(res, null, 'result');
    });

    it('should sanitize URL allowed by only list', () => {
      const url = 'https://example.com/"onmouseover="alert(1)"';
      const res = sanitizeURLSync(url, { only: ['data', 'git', 'https'] });
      assert.strictEqual(res, 'https://example.com/', 'result');
    });

    it('should return null for custom scheme with XSS', () => {
      const url = 'git+https://example.com/foo.git?<script>alert(1)</script>';
      const res = sanitizeURLSync(url, { only: ['data', 'git', 'https'] });
      assert.strictEqual(res, null, 'result');
    });

    if (woDomPurify) {
      it('should throw on data URL without DOMPurify', () => {
        const data =
          '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
        const url = `data:text/html,${encodeURIComponent(data)}`;
        assert.throws(() => sanitizeURLSync(url, { allow: ['data'] }));
      });

      it('should throw on base64 data URL without DOMPurify', () => {
        const base64data = btoa('<div><script>alert(1);</script></div>');
        const url = `data:text/html;base64,${base64data}`;
        assert.throws(() => sanitizeURLSync(url, { allow: ['data'] }));
      });

      it('should throw on base64 img URL without DOMPurify', () => {
        const base64data = btoa('<div><img src="javascript:alert(1)"></div>');
        const url = `data:text/html;base64,${base64data}`;
        assert.throws(() => sanitizeURLSync(url, { allow: ['data'] }));
      });

      it('should return null on blob URL without DOMPurify', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = sanitizeURLSync(url, { allow: ['blob'] });
        URL.revokeObjectURL(url);
        assert.deepEqual(res, null, 'result');
      });
    } else {
      it('should sanitize XSS from data:text/html URL', () => {
        const data =
          '<div><script>alert(1);</script></div><p onclick="alert(2)"></p>';
        const url = `data:text/html,${encodeURIComponent(data)}`;
        const res = sanitizeURLSync(url, { allow: ['data'] });
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

      it('should sanitize XSS from base64 data:text/html', () => {
        const base64data = btoa('<div><script>alert(1);</script></div>');
        const url = `data:text/html;base64,${base64data}`;
        const res = sanitizeURLSync(url, { allow: ['data'] });
        assert.strictEqual(res, 'data:text/html,%3Cdiv%3E%3C/div%3E', 'result');
        assert.strictEqual(
          decodeURIComponent(res),
          'data:text/html,<div></div>',
          'decode'
        );
      });

      it('should sanitize javascript: img from base64 data', () => {
        const base64data = btoa('<div><img src="javascript:alert(1)"></div>');
        const url = `data:text/html;base64,${base64data}`;
        const res = sanitizeURLSync(url, { allow: ['data'] });
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

      it('should return null for blob URL in sync mode', async () => {
        const data = '<svg><g onload="alert(1)"/></svg>';
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const res = sanitizeURLSync(url, { allow: ['blob'] });
        URL.revokeObjectURL(url);
        assert.deepEqual(res, null, 'result');
      });
    }
  });

  describe('inspect URL', () => {
    it('should invalidate malicious javascript: URL', async () => {
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

    it('should validate and parse standard HTTP URL', async () => {
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

    it('should validate and parse base64 PNG data URL', async () => {
      const data =
        'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const res = await inspectURL(`data:image/png;base64,${data}`);
      assert.deepEqual(
        res,
        {
          input: `data:image/png;base64,${data}`,
          valid: true,
          data: {
            mime: 'image/png',
            base64: true,
            data
          },
          href: `data:image/png;base64,${data}`,
          origin: 'null',
          protocol: 'data:',
          username: '',
          password: '',
          host: '',
          port: '',
          hostname: '',
          pathname: `image/png;base64,${data}`,
          search: '',
          hash: ''
        },
        'result'
      );
    });

    if (woDomPurify) {
      it('should invalidate data URL without DOMPurify', async () => {
        const data = '<svg><g onclick="alert(1)"/></svg>';
        const res = await inspectURL(`data:image/svg+xml;base64,${btoa(data)}`);
        assert.deepEqual(
          res,
          {
            input:
              'data:image/svg+xml;base64,PHN2Zz48ZyBvbmNsaWNrPSJhbGVydCgxKSIvPjwvc3ZnPg==',
            valid: false,
            href: null,
            reason:
              'DOMPurify is not available. Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
          },
          'result'
        );
      });

      it('should invalidate blob URL without DOMPurify', async () => {
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
            valid: false,
            href: null,
            reason:
              'DOMPurify is not available. Ensure DOMPurify is exposed globally (e.g., window.DOMPurify).'
          },
          'result'
        );
      });
    } else {
      it('should validate and parse data URL containing SVG', async () => {
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

      it('should validate and parse blob URL containing SVG', async () => {
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
    }
  });

  describe('is valid URI', () => {
    it('should return true for valid https URI', () => {
      const res = isValidURI('https://example.com/foo');
      assert.strictEqual(res, true, 'result');
    });

    it('should return false for javascript URI', () => {
      const res = isValidURI('javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });

    it('should return true for mailto URI', () => {
      const res = isValidURI('mailto:foo@example.com');
      assert.strictEqual(res, true, 'result');
    });

    it('should return false for unknown scheme', () => {
      const res = isValidURI('foo:bar');
      assert.strictEqual(res, false, 'result');
    });

    it('should return true for valid custom web+ scheme', () => {
      const res = isValidURI('web+foo:bar');
      assert.strictEqual(res, true, 'result');
    });

    it('should return false for restricted custom scheme', () => {
      const res = isValidURI('web+javascript:alert(1)');
      assert.strictEqual(res, false, 'result');
    });
  });
};
