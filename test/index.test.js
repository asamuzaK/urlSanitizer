/* api */
import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

/* test */
import urlSanitizer, {
  inspectURL,
  isValidURI,
  isURISync,
  sanitizeURL,
  sanitizeURLSync
} from '../src/index.js';
import { runSharedTests } from './shared-tests.js';

describe('URL Sanitizer (Node)', () => {
  describe('exported alias wrappers', () => {
    let sanitizeURLStub, sanitizeURLSyncStub, inspectURLStub, isValidURIStub;

    beforeEach(() => {
      sanitizeURLStub = sinon
        .stub(urlSanitizer, 'sanitizeURL')
        .resolves('sanitized-async');
      sanitizeURLSyncStub = sinon
        .stub(urlSanitizer, 'sanitizeURLSync')
        .returns('sanitized-sync');
      inspectURLStub = sinon
        .stub(urlSanitizer, 'inspectURL')
        .resolves({ valid: true });
      isValidURIStub = sinon.stub(urlSanitizer, 'isValidURI').returns(true);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('sanitizeURL should call urlSanitizer.sanitizeURL', async () => {
      const url = 'http://example.com';
      const opt = { allow: ['http'] };
      const result = await sanitizeURL(url, opt);
      assert.strictEqual(result, 'sanitized-async');
      assert.strictEqual(sanitizeURLStub.calledOnceWithExactly(url, opt), true);
    });

    it('sanitizeURLSync should call urlSanitizer.sanitizeURLSync', () => {
      const url = 'http://example.com';
      const opt = { allow: ['http'] };
      const result = sanitizeURLSync(url, opt);
      assert.strictEqual(result, 'sanitized-sync');
      assert.strictEqual(
        sanitizeURLSyncStub.calledOnceWithExactly(url, opt),
        true
      );
    });

    it('inspectURL should call urlSanitizer.inspectURL', async () => {
      const url = 'http://example.com';
      const result = await inspectURL(url);
      assert.deepEqual(result, { valid: true });
      assert.strictEqual(inspectURLStub.calledOnceWithExactly(url), true);
    });

    it('isValidURI should call urlSanitizer.isValidURI', () => {
      const url = 'http://example.com';
      const result = isValidURI(url);
      assert.strictEqual(result, true);
      assert.strictEqual(isValidURIStub.calledOnceWithExactly(url), true);
    });

    it('isURISync should call urlSanitizer.isValidURI (deprecated)', () => {
      const url = 'http://example.com';
      const result = isURISync(url);
      assert.strictEqual(result, true);
      assert.strictEqual(isValidURIStub.calledOnceWithExactly(url), true);
    });
  });

  describe('alias behavior', () => {
    it('exports all expected utility aliases', () => {
      assert.strictEqual(typeof sanitizeURL, 'function');
      assert.strictEqual(typeof sanitizeURLSync, 'function');
      assert.strictEqual(typeof inspectURL, 'function');
      assert.strictEqual(typeof isValidURI, 'function');
      assert.strictEqual(typeof isURISync, 'function');
    });

    runSharedTests(
      {
        afterEach,
        describe,
        it,
        urlSanitizer,
        sanitizeURL,
        sanitizeURLSync,
        inspectURL,
        isValidURI
      },
      assert
    );
  });
});
