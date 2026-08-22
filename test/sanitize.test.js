/**
 * sanitize.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

/* test */
import * as mjs from '../src/mjs/sanitize.js';

describe('sanitize', () => {
  describe('URL sanitizer', () => {
    const { URLSanitizer } = mjs;
    let sanitizer;

    beforeEach(() => {
      sanitizer = new URLSanitizer();
    });

    describe('Scheme Management (get, has, add, remove, reset)', () => {
      it('initializes with default IANA schemes', () => {
        const schemes = sanitizer.get();
        assert.ok(Array.isArray(schemes), 'returns an array');
        assert.ok(schemes.includes('https'), 'includes https');
        assert.ok(schemes.includes('http'), 'includes http');
      });

      it('checks scheme existence via has()', () => {
        assert.strictEqual(sanitizer.has('https'), true, 'has https');
        assert.strictEqual(
          sanitizer.has('HTTPS:'),
          true,
          'has HTTPS: with normalization'
        );
        assert.strictEqual(
          sanitizer.has('unknown-scheme'),
          false,
          'unknown scheme'
        );
        assert.strictEqual(sanitizer.has(null), false, 'non-string input');
      });

      it('adds custom valid scheme via add()', () => {
        const updated = sanitizer.add('web+mycustom');
        assert.ok(
          updated.includes('web+mycustom'),
          'returns updated schemes array'
        );
        assert.strictEqual(
          sanitizer.has('web+mycustom'),
          true,
          'scheme is now registered'
        );
      });

      it('throws TypeError when adding non-string scheme', () => {
        assert.throws(
          () => sanitizer.add(123),
          TypeError,
          'Expected String but got Number.'
        );
      });

      it('throws Error when adding dangerous or invalid scheme', () => {
        assert.throws(
          () => sanitizer.add('javascript'),
          Error,
          'Invalid scheme: javascript'
        );
        assert.throws(
          () => sanitizer.add('vbscript'),
          Error,
          'Invalid scheme: vbscript'
        );
      });

      it('removes a registered scheme via remove()', () => {
        const removed = sanitizer.remove('http');
        assert.strictEqual(removed, true, 'returns true on success');
        assert.strictEqual(sanitizer.has('http'), false, 'http is removed');
        assert.strictEqual(
          sanitizer.remove(123),
          false,
          'returns false for non-string'
        );
      });

      it('resets schemes back to default via reset()', () => {
        sanitizer.remove('http');
        sanitizer.add('web+custom');
        assert.strictEqual(sanitizer.has('http'), false);
        assert.strictEqual(sanitizer.has('web+custom'), true);
        sanitizer.reset();
        assert.strictEqual(sanitizer.has('http'), true, 'http is restored');
        assert.strictEqual(
          sanitizer.has('web+custom'),
          false,
          'custom scheme is removed'
        );
      });
    });

    describe('isValidURI()', () => {
      it('returns true for valid allowed URIs', () => {
        assert.strictEqual(sanitizer.isValidURI('https://example.com'), true);
        assert.strictEqual(
          sanitizer.isValidURI('mailto:foo@example.com'),
          true
        );
      });

      it('returns false for invalid or blocked URIs', () => {
        assert.strictEqual(sanitizer.isValidURI('javascript:alert(1)'), false);
        assert.strictEqual(sanitizer.isValidURI('invalid-uri'), false);
        assert.strictEqual(sanitizer.isValidURI(null), false);
      });
    });

    describe('sanitizeURLSync()', () => {
      it('returns null for missing, non-string, or empty input', () => {
        assert.strictEqual(sanitizer.sanitizeURLSync(), null);
        assert.strictEqual(sanitizer.sanitizeURLSync(''), null);
        assert.strictEqual(sanitizer.sanitizeURLSync(123), null);
      });

      it('sanitizes standard HTTPS URL synchronously', () => {
        const res = sanitizer.sanitizeURLSync(
          'https://example.com/path?query=1#hash'
        );
        assert.strictEqual(res, 'https://example.com/path?query=1#hash');
      });

      it('blocks relative URLs by default and allows when allowRelative is true', () => {
        assert.strictEqual(sanitizer.sanitizeURLSync('/about/us'), null);
        const res = sanitizer.sanitizeURLSync('/about/us', {
          allowRelative: true
        });
        assert.strictEqual(res, '/about/us');
      });

      it('returns null for blob URLs in sync mode (and revokes if requested)', () => {
        const revokeStub = sinon.stub(URL, 'revokeObjectURL');
        try {
          const blobUrl = 'blob:https://example.com/uuid';
          assert.strictEqual(sanitizer.sanitizeURLSync(blobUrl), null);
          assert.strictEqual(revokeStub.called, false);
          assert.strictEqual(
            sanitizer.sanitizeURLSync(blobUrl, { revokeObjectURL: true }),
            null
          );
          assert.strictEqual(revokeStub.calledWith(blobUrl), true);
        } finally {
          revokeStub.restore();
        }
      });

      it('honors deny and only options', () => {
        const denied = sanitizer.sanitizeURLSync('https://example.com', {
          deny: ['https']
        });
        assert.strictEqual(denied, null);
        const only = sanitizer.sanitizeURLSync('http://example.com', {
          only: ['https']
        });
        assert.strictEqual(only, null);
      });
    });

    describe('sanitizeURL() Async', () => {
      it('sanitizes data URL asynchronously when explicitly allowed', async () => {
        const res = await sanitizer.sanitizeURL('data:text/plain,hello', {
          allow: ['data']
        });
        assert.strictEqual(res, 'data:text/plain,hello');
      });

      it('returns null if data URL is not allowed', async () => {
        const res = await sanitizer.sanitizeURL('data:text/plain,hello');
        assert.strictEqual(res, null);
      });

      it('returns null for invalid inputs', async () => {
        assert.strictEqual(await sanitizer.sanitizeURL(), null);
        assert.strictEqual(await sanitizer.sanitizeURL(''), null);
        assert.strictEqual(await sanitizer.sanitizeURL('invalid-scheme'), null);
      });

      it('sanitizes standard HTTPS URL asynchronously', async () => {
        const res = await sanitizer.sanitizeURL(
          'https://example.com/path?query=1#hash'
        );
        assert.strictEqual(
          res,
          'https://example.com/path?query=1#hash',
          'should return the sanitized standard URL'
        );
      });
    });

    describe('Blob URL handling', () => {
      let fetchStub;
      let warnStub;

      beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
        warnStub = sinon.stub(console, 'warn');
      });

      afterEach(() => {
        fetchStub.restore();
        warnStub.restore();
      });

      it('sanitizes blob URL via stream reading (response.body)', async () => {
        const text = 'Hello Stream Blob';
        const encoder = new TextEncoder();
        const uint8 = encoder.encode(text);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(uint8);
            controller.close();
          }
        });
        fetchStub.resolves(
          new Response(stream, {
            status: 200,
            headers: { 'content-type': 'text/plain' }
          })
        );
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob']
          }
        );
        assert.strictEqual(res, 'data:text/plain,Hello Stream Blob');
      });

      it('sanitizes blob URL via response.blob() fallback when body is null', async () => {
        const blob = new Blob(['Hello Blob Fallback'], { type: 'text/plain' });
        const mockResponse = new Response(blob, {
          status: 200,
          headers: { 'content-type': 'text/plain' }
        });
        Object.defineProperty(mockResponse, 'body', { value: null });
        fetchStub.resolves(mockResponse);
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob']
          }
        );
        assert.strictEqual(res, 'data:text/plain,Hello Blob Fallback');
      });

      it('appends data scheme automatically when only or allow options are passed for blob', async () => {
        fetchStub.resolves(
          new Response('Only Blob', {
            status: 200,
            headers: { 'content-type': 'text/plain' }
          })
        );
        const resOnly = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            only: ['blob']
          }
        );
        assert.strictEqual(resOnly, 'data:text/plain,Only Blob');
      });

      it('handles content-length header overflow', async () => {
        fetchStub.resolves(
          new Response('dummy', {
            status: 200,
            headers: {
              'content-type': 'text/plain',
              'content-length': '10000'
            }
          })
        );
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob'],
            maxBlobSize: 100,
            debug: true
          }
        );
        assert.strictEqual(res, null);
        assert.strictEqual(warnStub.called, true);
        assert.ok(
          warnStub.firstCall.args[0].includes(
            'Failed to fetch and convert blob URL'
          )
        );
      });

      it('handles stream reading overflow', async () => {
        const chunk1 = new Uint8Array(60);
        const chunk2 = new Uint8Array(60);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(chunk1);
            controller.enqueue(chunk2);
            controller.close();
          }
        });
        fetchStub.resolves(
          new Response(stream, {
            status: 200,
            headers: { 'content-type': 'text/plain' }
          })
        );
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob'],
            maxBlobSize: 100
          }
        );
        assert.strictEqual(res, null);
      });

      it('handles HTTP error responses (!response.ok)', async () => {
        fetchStub.resolves(
          new Response(null, {
            status: 404,
            statusText: 'Not Found'
          })
        );
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob'],
            debug: true
          }
        );
        assert.strictEqual(res, null);
        assert.ok(
          warnStub.firstCall.args[0].includes(
            'Failed to fetch and convert blob URL'
          )
        );
      });

      it('revokes ObjectURL when revokeObjectURL option is true', async () => {
        const revokeStub = sinon.stub(URL, 'revokeObjectURL');
        try {
          fetchStub.resolves(
            new Response('test', {
              status: 200,
              headers: { 'content-type': 'text/plain' }
            })
          );
          const blobUrl = 'blob:https://example.com/uuid';
          await sanitizer.sanitizeURL(blobUrl, {
            allow: ['blob'],
            revokeObjectURL: true
          });
          assert.strictEqual(revokeStub.calledWith(blobUrl), true);
        } finally {
          revokeStub.restore();
        }
      });

      it('handles HTTP error responses without statusText', async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: ''
        };
        fetchStub.resolves(mockResponse);
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob'],
            debug: true
          }
        );
        assert.strictEqual(res, null, 'should return null on fetch failure');
        assert.strictEqual(
          warnStub.called,
          true,
          'should log the error in debug mode'
        );
        const caughtError = warnStub.firstCall.args[1];
        assert.ok(
          caughtError instanceof Error,
          'should pass the Error object to logger'
        );
        assert.strictEqual(
          caughtError.message,
          'Failed to fetch blob:https://example.com/uuid: 500',
          'error message should contain only status code when statusText is empty'
        );
      });

      it('throws DOMException when blob.size exceeds maxSize', async () => {
        const oversizedBlob = new Blob(['A'.repeat(150)], {
          type: 'text/plain'
        });
        const mockResponse = {
          ok: true,
          headers: new Headers({ 'content-type': 'text/plain' }),
          body: null,
          blob: async () => oversizedBlob
        };
        fetchStub.resolves(mockResponse);
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob'],
            maxBlobSize: 100,
            debug: true
          }
        );
        assert.strictEqual(
          res,
          null,
          'result should be null due to blob size overflow'
        );
        assert.strictEqual(
          warnStub.called,
          true,
          'debug log should be printed'
        );
        const caughtError = warnStub.firstCall.args[1];
        assert.ok(
          caughtError instanceof DOMException,
          'should throw DOMException'
        );
        assert.strictEqual(
          caughtError.name,
          'NotReadableError',
          'error name should be NotReadableError'
        );
        assert.strictEqual(
          caughtError.message,
          'Payload (150 bytes) exceeds max (100 bytes).',
          'error message should precisely match the blob.size check template'
        );
      });

      it('falls back to empty string when content-type header is missing', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('No Mime'));
            controller.close();
          }
        });
        fetchStub.resolves(
          new Response(stream, {
            status: 200,
            headers: {}
          })
        );
        const res = await sanitizer.sanitizeURL(
          'blob:https://example.com/uuid',
          {
            allow: ['blob']
          }
        );
        assert.strictEqual(
          res,
          'data:,No Mime',
          'should fall back to empty mimeType and construct plain data URL'
        );
      });
    });

    describe('inspectURL()', () => {
      let fetchStub;

      beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
      });

      afterEach(() => {
        fetchStub.restore();
      });

      it('returns invalid inspected result for non-string or empty input', async () => {
        const res1 = await sanitizer.inspectURL(null);
        assert.strictEqual(res1.valid, false);
        assert.ok(res1.reason.includes('Invalid URL input'));
        const res2 = await sanitizer.inspectURL('');
        assert.strictEqual(res2.valid, false);
        assert.strictEqual(res2.reason, 'Invalid URL input: (empty string)');
      });

      it('inspects standard valid HTTPS URL', async () => {
        const res = await sanitizer.inspectURL(
          'https://usr:pwd@example.com:8080/path?q=1#top'
        );
        assert.strictEqual(res.valid, true);
        assert.strictEqual(res.protocol, 'https:');
        assert.strictEqual(res.hostname, 'example.com');
        assert.strictEqual(res.username, 'usr');
        assert.strictEqual(res.password, 'pwd');
        assert.strictEqual(res.port, '8080');
        assert.strictEqual(res.data, null);
      });

      it('inspects data URL and extracts data metadata', async () => {
        const res = await sanitizer.inspectURL(
          'data:text/plain;base64,SGVsbG8='
        );
        assert.strictEqual(res.valid, true);
        assert.deepEqual(res.data, {
          mime: 'text/plain',
          base64: false,
          data: 'Hello'
        });
      });

      it('inspects relative URL properly', async () => {
        const res = await sanitizer.inspectURL('/about/us?q=1');
        assert.strictEqual(res.valid, false);
        assert.strictEqual(res.relative, true);
        assert.strictEqual(res.href, '/about/us?q=1');
      });

      it('inspects blob URL by converting to data URL internally', async () => {
        const blob = new Blob(['Inspect Blob'], { type: 'text/plain' });
        fetchStub.resolves(
          new Response(blob, {
            status: 200,
            headers: { 'content-type': 'text/plain' }
          })
        );
        const res = await sanitizer.inspectURL('blob:https://example.com/uuid');
        assert.strictEqual(res.valid, true);
        assert.strictEqual(res.input, 'blob:https://example.com/uuid');
        assert.strictEqual(res.href, 'data:text/plain,Inspect Blob');
      });

      it('returns invalid result when fetching blob URL fails during inspectURL', async () => {
        fetchStub.rejects(new Error('Network Error'));
        const res = await sanitizer.inspectURL('blob:https://example.com/uuid');
        assert.strictEqual(res.valid, false);
        assert.strictEqual(res.reason, 'Network Error');
      });

      it('returns invalid reason when sanitization fails', async () => {
        const res = await sanitizer.inspectURL('javascript:alert(1)');
        assert.strictEqual(res.valid, false, 'should be invalid');
        assert.strictEqual(
          res.reason,
          'Sanitization failed (blocked by allowed schemes or rules).',
          'should contain the correct invalid reason for blocked schemes'
        );
      });

      it('catches errors and assigns the error message to reason', async () => {
        let nestedUrl;
        for (let i = 0; i < 18; i++) {
          const srcUrl = nestedUrl || `https://example.com/?q=${i}`;
          const html = `<img src="${srcUrl}">`;
          const htmlBase64 = btoa(html);
          nestedUrl = `data:text/html;base64,${htmlBase64}`;
        }
        const res = await sanitizer.inspectURL(nestedUrl);
        assert.strictEqual(res.valid, false, 'should be invalid');
        assert.strictEqual(
          res.reason,
          'Data URLs nested too deeply.',
          'reason should contain the caught error message'
        );
      });

      it('pops "base64" from mediaTypes when the sanitized URL retains base64 encoding', async () => {
        const validBase64Img = 'data:image/png;base64,iVBORw0KGgo=';
        const res = await sanitizer.inspectURL(validBase64Img);
        assert.strictEqual(res.valid, true, 'should be valid');
        assert.deepEqual(
          res.data,
          {
            mime: 'image/png',
            base64: true,
            data: 'iVBORw0KGgo='
          },
          'mime type should not include base64 after pop()'
        );
      });

      it('constructs Data URL without mimeType when content-type is missing', async () => {
        const text = 'No Mime Inspect';
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(text));
            controller.close();
          }
        });
        fetchStub.resolves(
          new Response(stream, {
            status: 200,
            headers: {}
          })
        );
        const res = await sanitizer.inspectURL('blob:https://example.com/uuid');
        assert.strictEqual(res.valid, true, 'should be valid');
        assert.strictEqual(
          res.input,
          'blob:https://example.com/uuid',
          'should retain original blob URL as input'
        );
        assert.deepEqual(
          res.data,
          {
            mime: '',
            base64: false,
            data: 'No Mime Inspect'
          },
          'metadata should reflect an empty mime type'
        );
      });
    });
  });
});
