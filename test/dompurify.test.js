/**
 * dompurify.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import { domPurify } from '../src/mjs/dompurify.js';

describe('DOMPurify', () => {
  describe('domPurify', () => {
    it('should have methods', () => {
      assert.strictEqual(typeof domPurify.sanitize, 'function', 'sanitize');
    });
  });
});
