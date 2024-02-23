/**
 * dompurify.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import { domPurify } from '../src/mjs/dompurify.js';

describe('DOMPurify', () => {
  describe('domPurify', () => {
    it('should have methods', () => {
      assert.isFunction(domPurify.sanitize, 'sanitize');
    });
  });
});
