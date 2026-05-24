/**
 * dompurify.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import { createDOMPurify } from '../src/mjs/dompurify.js';

describe('DOMPurify', () => {
  describe('createDOMPurify', () => {
    it('should be a function', () => {
      assert.strictEqual(typeof createDOMPurify, 'function', 'createDOMPurify');
    });

    it('should return a DOMPurify instance with required methods', () => {
      const domPurify = createDOMPurify();
      assert.strictEqual(typeof domPurify.sanitize, 'function', 'sanitize');
      assert.strictEqual(typeof domPurify.addHook, 'function', 'addHook');
      assert.strictEqual(typeof domPurify.removeHook, 'function', 'removeHook');
    });

    it('should return an isolated instance on each call', () => {
      const instance1 = createDOMPurify();
      const instance2 = createDOMPurify();
      assert.notStrictEqual(instance1, instance2,
        'instances should be distinct');
    });
  });
});
