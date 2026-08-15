/**
 * common.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

/* test */
import * as mjs from '../src/mjs/common.js';

describe('common', () => {
  describe('get type', () => {
    const func = mjs.getType;

    it('should get Array', () => {
      const res = func([]);
      assert.strictEqual(res, 'Array');
    });

    it('should get Object', () => {
      const res = func({});
      assert.strictEqual(res, 'Object');
    });

    it('should get String', () => {
      const res = func('');
      assert.strictEqual(res, 'String');
    });

    it('should get Number', () => {
      const res = func(1);
      assert.strictEqual(res, 'Number');
    });

    it('should get Boolean', () => {
      const res = func(true);
      assert.strictEqual(res, 'Boolean');
    });

    it('should get Undefined', () => {
      const res = func();
      assert.strictEqual(res, 'Undefined');
    });

    it('should get Null', () => {
      const res = func(null);
      assert.strictEqual(res, 'Null');
    });
  });

  describe('is string', () => {
    const func = mjs.isString;

    it('should get false', () => {
      const items = [[], ['foo'], {}, { foo: 'bar' }, undefined, null, 1, true];
      for (const item of items) {
        assert.strictEqual(func(item), false);
      }
    });

    it('should get true', () => {
      const items = ['', 'foo'];
      for (const item of items) {
        assert.strictEqual(func(item), true);
      }
    });
  });

  describe('logDebug', () => {
    const func = mjs.logDebug;
    let warnStub;
    beforeEach(() => {
      warnStub = sinon.stub(console, 'warn');
    });
    afterEach(() => {
      warnStub.restore();
    });

    it('logs message to console.warn', () => {
      func('Test message');
      assert.strictEqual(
        warnStub.calledOnce,
        true,
        'console.warn should be called once'
      );
      assert.strictEqual(
        warnStub.calledWith('[URLSanitizer Debug] Test message'),
        true,
        'should include error message'
      );
    });

    it('logs message and error details when isDebug is true', () => {
      const testError = new Error('Test error detail');
      func('Test message', testError);
      assert.strictEqual(
        warnStub.calledOnce,
        true,
        'console.warn should be called once'
      );
      assert.strictEqual(
        warnStub.calledWith('[URLSanitizer Debug] Test message', testError),
        true,
        'should include error message and the original error'
      );
    });
  });
});
