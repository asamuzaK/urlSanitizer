/**
 * constant.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import * as constant from '../src/mjs/constant.js';

describe('constants', () => {
  const items = Object.entries(constant);
  for (const [key, value] of items) {
    it('should get string or number or regexp', () => {
      assert.strictEqual(/^[A-Z][A-Z_\d]+$/.test(key), true, 'key');
      assert.strictEqual(typeof value === 'string' || Number.isInteger(value) ||
        value instanceof RegExp, true, 'value');
    });
  }
});
