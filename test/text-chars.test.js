/* test/text-chars.test.js */

/* api */
import { strict as assert } from 'node:assert';
import { describe, it } from 'mocha';

/* test */
import textChars from '../src/lib/file/text-chars.json' with { type: 'json' };
import { CTRL_CHAR_CODES, TEXT_CHAR_CODES, WINDOWS1252_TO_UNICODE } from '../src/mjs/text-chars.js';

describe('text-chars', () => {
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

  describe('WINDOWS1252_TO_UNICODE', () => {
    it('should be a Map containing Windows-1252 mapping', () => {
      assert.ok(WINDOWS1252_TO_UNICODE instanceof Map,
        'WINDOWS1252_TO_UNICODE should be a Map');
      assert.strictEqual(WINDOWS1252_TO_UNICODE.size, 27,
        'Size should be exactly 27');
    });
  });

  describe('CTRL_CHAR_CODES', () => {
    it('should be a Map containing escaped non-text hex codes', () => {
      assert.ok(CTRL_CHAR_CODES instanceof Map,
        'CTRL_CHAR_CODES should be a Map');
      assert.strictEqual(
        CTRL_CHAR_CODES.size,
        256 - textChars.length - WINDOWS1252_TO_UNICODE.size,
        'Size should be exactly 256 minus the number of valid text chars and mapped chars'
      );
      for (let i = 0; i < 256; i++) {
        if (!TEXT_CHAR_CODES.has(i) && !WINDOWS1252_TO_UNICODE.has(i)) {
          const expected =
            `\\x${i.toString(16).padStart(2, '0').toUpperCase()}`;
          assert.ok(
            CTRL_CHAR_CODES.has(i),
            `CTRL_CHAR_CODES should have key ${i}`
          );
          assert.strictEqual(
            CTRL_CHAR_CODES.get(i),
            expected,
            `CTRL_CHAR_CODES should contain ${expected} for char code 0x${i.toString(16)}`
          );
        }
      }
    });

    it('should successfully build a valid RegExp from the Map values', () => {
      const regexString = `[${[...CTRL_CHAR_CODES.values()].join('')}]`;
      assert.doesNotThrow(() => {
        RegExp(regexString);
      }, 'Building RegExp from CTRL_CHAR_CODES should not throw');
    });
  });
});
