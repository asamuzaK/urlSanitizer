/**
 * constant.test.js
 */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import * as constant from '../src/mjs/constant.js';

describe('constants', () => {
  const items = Object.keys(constant);
  for (const key of items) {
    it('should be upper snake case', () => {
      assert.strictEqual(/^[A-Z][A-Z_\d]+$/.test(key), true, `key: ${key}`);
    });
  }
});
