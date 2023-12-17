/**
 * constant.test.js
 */

/* api */
import { assert } from 'chai';
import { describe, it } from 'mocha';

/* test */
import * as constant from '../src/mjs/constant.js';

describe('constants', () => {
  const items = Object.entries(constant);
  for (const [key, value] of items) {
    it('should get string or number or regexp', () => {
      assert.isTrue(/^[A-Z][A-Z_\d]+$/.test(key), 'key');
      assert.isTrue(typeof value === 'string' || Number.isInteger(value) ||
        value instanceof RegExp, 'value');
    });
  }
});
