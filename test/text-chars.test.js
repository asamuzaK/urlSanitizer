/* test/text-util.test.js */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import textChars from '../src/lib/file/text-chars.json' with { type: 'json' };
import { CTRL_CHAR_CODES, TEXT_CHAR_CODES } from '../src/mjs/text-chars.js';

describe('text-util', () => {
  describe('TEXT_CHAR_CODES', () => {
    it('should be a Set containing all valid text character codes', () => {
      assert.ok(TEXT_CHAR_CODES instanceof Set,
        'TEXT_CHAR_CODES should be a Set');
      assert.strictEqual(TEXT_CHAR_CODES.size, textChars.length,
        'Size should match the JSON array length');
      for (const code of textChars) {
        assert.ok(TEXT_CHAR_CODES.has(code),
          `TEXT_CHAR_CODES should contain ${code}`);
      }
    });
  });

  describe('CTRL_CHAR_CODES', () => {
    it('should be a Set containing escaped non-text hex codes', () => {
      assert.ok(CTRL_CHAR_CODES instanceof Set,
        'CTRL_CHAR_CODES should be a Set');
      assert.strictEqual(
        CTRL_CHAR_CODES.size,
        256 - textChars.length,
        'Size should be exactly 256 minus the number of valid text chars'
      );
      for (let i = 0; i < 256; i++) {
        if (!TEXT_CHAR_CODES.has(i)) {
          let expected;
          if (i === 0x2D) {
            expected = '\\-';
          } else if (i === 0x5C) {
            expected = '\\\\';
          } else if (i === 0x5D) {
            expected = '\\]';
          } else if (i === 0x5E) {
            expected = '\\^';
          } else {
            expected = `\\x${i.toString(16).padStart(2, '0').toUpperCase()}`;
          }
          assert.ok(
            CTRL_CHAR_CODES.has(expected),
            `CTRL_CHAR_CODES should contain ${expected} for char code 0x${i.toString(16)}`
          );
        }
      }
    });

    it('should successfully build a valid RegExp from the Set', () => {
      const regexString = `[${[...CTRL_CHAR_CODES].join('')}]`;
      assert.doesNotThrow(() => {
        RegExp(regexString);
      }, 'Building RegExp from CTRL_CHAR_CODES should not throw');
    });
  });
});
